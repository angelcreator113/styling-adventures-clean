// src/components/smart-dropdown.js
// @ts-check
import { loadCategories, getCategories, onCategories } from "./categoryStore.js";

/** looks like a Firestore-ish id (skip showing these) */
function isDocIdLike(k = "") {
  return /^[A-Za-z0-9_-]{20,}$/.test(String(k));
}
function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

const META_KEYS = new Set([
  "id","uid","slug","key","value","name","label","title","displayName","text",
  "createdAt","updatedAt","order"
]);

function labelOf(node, fallbackKey = "") {
  if (typeof node === "string") return node;
  if (isPlainObject(node)) {
    return (
      node.name ||
      node.label ||
      node.title ||
      node.displayName ||
      node.text ||
      node.data?.name ||
      node.data?.label ||
      fallbackKey ||
      ""
    );
  }
  return fallbackKey || "";
}

/**
 * Convert a branch into a flat list of option labels.
 * - Strings are ignored (they’re leaves, not branches)
 * - When childrenOnly is true, only include entries whose values are Array/Object
 */
function toLabelList(branch, { childrenOnly = false } = {}) {
  if (!branch) return [];

  if (typeof branch === "string") {
    // important: do not explode strings into letters
    return [];
  }

  if (Array.isArray(branch)) {
    return branch
      .map(v => (typeof v === "string" ? v : labelOf(v)))
      .filter(Boolean);
  }

  if (isPlainObject(branch)) {
    const out = [];
    for (const [k, v] of Object.entries(branch)) {
      // skip metadata-ish keys
      if (META_KEYS.has(k)) continue;

      // when childrenOnly, only accept arrays/objects
      if (childrenOnly && !(Array.isArray(v) || isPlainObject(v))) continue;

      // avoid listing doc ids as categories
      if (isDocIdLike(k)) continue;

      const lbl = labelOf(v, k);
      if (lbl) out.push(String(lbl));
    }
    // de-dup while preserving order
    return [...new Set(out)];
  }

  return [];
}

/**
 * Given the category tree and current selections, derive lists for each level.
 */
function deriveLists(tree, category, subcategory) {
  // top-level categories should be real branches (objects/arrays)
  const categories = toLabelList(tree, { childrenOnly: true });

  let subcats = [];
  let items = [];

  const catNode =
    category && tree
      ? tree[category] ??
        Object.values(tree).find(v => labelOf(v) === category)
      : null;

  if (catNode) {
    if (Array.isArray(catNode)) {
      // category directly contains items
      items = toLabelList(catNode);
    } else if (isPlainObject(catNode)) {
      // only take real child branches for subcats
      subcats = toLabelList(catNode, { childrenOnly: true });

      const subNode =
        subcategory && catNode
          ? catNode[subcategory] ??
            Object.values(catNode).find(v => labelOf(v) === subcategory)
          : null;

      if (subNode) {
        if (Array.isArray(subNode)) {
          items = toLabelList(subNode);
        } else if (isPlainObject(subNode)) {
          // items can be strings or objects; include both
          items = toLabelList(subNode, { childrenOnly: false });
        } else {
          // string/number: treat as leaf -> no sub-subcategory list
          items = [];
        }
      }
    }
  }

  return { categories, subcats, items };
}

/** Populate a <select> with string options (keeps previous value if still valid) */
function populateOptions(selectEl, options) {
  if (!selectEl) return;
  const prev = selectEl.value;
  selectEl.innerHTML = `<option value="">Select</option>`;
  const seen = new Set();
  for (const opt of options) {
    if (!opt || seen.has(opt)) continue;
    seen.add(opt);
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    selectEl.appendChild(o);
  }
  if (prev && options.includes(prev)) {
    selectEl.value = prev;
  }
}

/**
 * Setup cascading dropdowns driven by categoryStore.
 * @param {HTMLSelectElement|null} categoryEl
 * @param {HTMLSelectElement|null} subcategoryEl
 * @param {HTMLSelectElement|null} subsubcategoryEl
 * @param {string} panelType
 * @param {{ skipActiveCheck?: boolean, initialValue?: {category?:string, subcategory?:string, subsubcategory?:string} }} [opts]
 */
export function setupSmartDropdown(
  categoryEl,
  subcategoryEl,
  subsubcategoryEl,
  panelType,
  opts = {}
) {
  const { skipActiveCheck = false, initialValue } = opts;

  if (!panelType) {
    console.warn("[SmartDropdown] Missing panelType identifier. Setup skipped.");
    return stubController();
  }

  if (!skipActiveCheck) {
    const root = document.querySelector(
      `#${panelType}, #${panelType}-panel, [data-panel="${panelType}"]`
    );
    if (!root) return stubController();
  }

  let value = { category: "", subcategory: "", subsubcategory: "" };

  const readTree = () => (getCategories(panelType)?.categories || {});

  const onCatChange = () => {
    value.category = categoryEl?.value || "";
    const tree = readTree();
    const { subcats } = deriveLists(tree, value.category, "");
    populateOptions(subcategoryEl, subcats);
    value.subcategory = "";
    populateOptions(subsubcategoryEl, []);
    value.subsubcategory = "";
  };

  const onSubChange = () => {
    value.subcategory = subcategoryEl?.value || "";
    const tree = readTree();
    const { items } = deriveLists(tree, value.category, value.subcategory);
    populateOptions(subsubcategoryEl, items);
    value.subsubcategory = "";
  };

  const onSub2Change = () => {
    value.subsubcategory = subsubcategoryEl?.value || "";
  };

  categoryEl?.addEventListener("change", onCatChange);
  subcategoryEl?.addEventListener("change", onSubChange);
  subsubcategoryEl?.addEventListener("change", onSub2Change);

  let unsubscribe = () => {};
  const bindToStore = () => {
    unsubscribe = onCategories(panelType, () => {
      const tree = readTree();
      const { categories, subcats, items } = deriveLists(
        tree,
        value.category,
        value.subcategory
      );

      populateOptions(categoryEl, categories);
      if (value.category && !categories.includes(value.category)) value.category = "";
      if (categoryEl) categoryEl.value = value.category;

      populateOptions(subcategoryEl, subcats);
      if (value.subcategory && !subcats.includes(value.subcategory)) value.subcategory = "";
      if (subcategoryEl) subcategoryEl.value = value.subcategory;

      populateOptions(subsubcategoryEl, items);
      if (value.subsubcategory && !items.includes(value.subsubcategory))
        value.subsubcategory = "";
      if (subsubcategoryEl) subsubcategoryEl.value = value.subsubcategory;
    });
  };

  (async () => {
    try {
      await loadCategories(panelType);
    } catch (e) {
      console.warn("[SmartDropdown] loadCategories failed:", e);
    }

    const tree = readTree();
    const { categories } = deriveLists(tree, "", "");
    populateOptions(categoryEl, categories);

    if (initialValue?.category && categoryEl) categoryEl.value = initialValue.category;
    onCatChange();

    if (initialValue?.subcategory && subcategoryEl)
      subcategoryEl.value = initialValue.subcategory;
    onSubChange();

    if (initialValue?.subsubcategory && subsubcategoryEl)
      subsubcategoryEl.value = initialValue.subsubcategory;
    onSub2Change();

    bindToStore();
  })();

  return {
    getValue: () => ({ ...value }),
    setValue: (v) => {
      if (v.category && categoryEl) {
        categoryEl.value = v.category;
        onCatChange();
      }
      if (v.subcategory && subcategoryEl) {
        subcategoryEl.value = v.subcategory;
        onSubChange();
      }
      if (v.subsubcategory && subsubcategoryEl) {
        subsubcategoryEl.value = v.subsubcategory;
        onSub2Change();
      }
    },
    destroy: () => {
      categoryEl?.removeEventListener("change", onCatChange);
      subcategoryEl?.removeEventListener("change", onSubChange);
      subsubcategoryEl?.removeEventListener("change", onSub2Change);
      try { unsubscribe(); } catch {}
    },
  };
}

/** fallback no-op controller */
function stubController() {
  return {
    getValue: () => ({ category: "", subcategory: "", subsubcategory: "" }),
    setValue: () => {},
    destroy: () => {},
  };
}

/**
 * Auto-initialize all smart dropdowns inside a given panel
 */
export function initSmartDropdownAll({ panelId, panelTypeOverride, skipActiveCheck = true }) {
  const slug = panelId.replace(/-panel$/, "");
  const panel =
    document.getElementById(panelId) ||
    document.getElementById(slug) ||
    document.querySelector(`[data-panel="${slug}"]`);

  if (!panel) return;

  const $ = (suffix) => /** @type {HTMLSelectElement|null} */ (
    panel.querySelector(`#${slug}-${suffix}`)
  );

  const categoryEl = $("category");
  const subcategoryEl = $("subcategory");
  const subsubcategoryEl = $("subsubcategory");
  if (!categoryEl || !subcategoryEl) return;

  const panelType = panelTypeOverride || slug;

  setupSmartDropdown(categoryEl, subcategoryEl, subsubcategoryEl, panelType, {
    skipActiveCheck,
  });
}
