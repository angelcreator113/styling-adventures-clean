// src/utils/panels/categories.js
import { db } from '@/utils/init-firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

/**
 * Category docs format (in categories/{panel}/items):
 * { path: ['Tops','Shirts','Button-down'] }
 * Level = path.length (1..3). Use whatever labels you like.
 */

export async function fetchCategoryTree(panelSlug) {
  const ref = collection(db, `categories/${panelSlug}/items`);
  const snap = await getDocs(query(ref, orderBy('path')));
  /** @type {{[L:number]: Map<string, Set<string>>}} */
  const levels = { 1: new Map(), 2: new Map(), 3: new Map() };

  snap.forEach((d) => {
    const path = d.data()?.path || [];
    if (!Array.isArray(path) || path.length === 0) return;
    const [L1, L2, L3] = path;

    if (L1) {
      if (!levels[1].has(L1)) levels[1].set(L1, new Set());
    }
    if (L1 && L2) {
      const key = `${L1}`;
      if (!levels[2].has(key)) levels[2].set(key, new Set());
      levels[2].get(key).add(L2);
    }
    if (L1 && L2 && L3) {
      const key = `${L1}›${L2}`;
      if (!levels[3].has(key)) levels[3].set(key, new Set());
      levels[3].get(key).add(L3);
    }
  });

  return levels;
}

/**
 * Bind three select boxes:
 *   #${uiPrefix}category
 *   #${uiPrefix}subcategory
 *   #${uiPrefix}subsubcategory
 */
export async function bindThreeLevelDropdowns(panelSlug, uiPrefix) {
  const catSel  = document.getElementById(`${uiPrefix}category`);
  const subSel  = document.getElementById(`${uiPrefix}subcategory`);
  const sub2Sel = document.getElementById(`${uiPrefix}subsubcategory`);
  if (!catSel || !subSel || !sub2Sel) return;

  const levels = await fetchCategoryTree(panelSlug);

  const fill = (sel, values) => {
    sel.innerHTML = '';
    const first = document.createElement('option');
    first.value = ''; first.textContent = sel === catSel ? 'Select category' : '—';
    sel.appendChild(first);
    [...values].sort().forEach((v) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
    sel.value = '';
  };

  // L1
  fill(catSel, levels[1].keys());

  const onL1 = () => {
    const L1 = catSel.value;
    const L2s = L1 ? (levels[2].get(`${L1}`) || new Set()) : new Set();
    fill(subSel, L2s);
    fill(sub2Sel, new Set());
  };
  const onL2 = () => {
    const L1 = catSel.value;
    const L2 = subSel.value;
    const L3s = (L1 && L2) ? (levels[3].get(`${L1}›${L2}`) || new Set()) : new Set();
    fill(sub2Sel, L3s);
  };

  catSel.addEventListener('change', onL1);
  subSel.addEventListener('change', onL2);

  // initial cascade
  onL1();

  // return unbinder if you ever need it
  return () => {
    catSel.removeEventListener('change', onL1);
    subSel.removeEventListener('change', onL2);
  };
}
