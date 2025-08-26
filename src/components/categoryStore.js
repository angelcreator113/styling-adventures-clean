// src/components/categoryStore.js
// @ts-check

// Use the same Firebase init as the rest of the app
import { db } from "@/utils/init-firebase";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";

const ROOT = "categories";
const LS_KEY = (p) => `dropdowns-${p}`;

/** @typedef {{ tree: Record<string, any>, map: Record<string, any> }} PanelState */

/** in-memory cache + subscribers */
const cache = new Map();           /** @type {Map<string, PanelState>} */
const subs  = new Map();           /** @type {Map<string, Set<(snap: {categories:any, map:any}) => void>>} */

/** Fallback seed so UI isn’t empty on a fresh project */
const DEFAULT_SEED = {
  closet: {
    Tops: { Tees: ["Graphic", "Plain"], Blouses: ["Silk", "Cotton"] },
    Bottoms: { Jeans: ["Straight", "Skinny"], Skirts: ["Mini", "Midi"] },
  },
  voice: {
    Narration: { Promo: ["Short", "Long"], Tutorial: ["Step-by-step"] },
    Dialogue: { Interview: ["Guest"], Monologue: ["Personal"] },
  },
  episodes: {
    Season1: { Ep01: ["Cut A", "Cut B"], Ep02: ["Cut A"] },
    Clips: { Shorts: ["15s", "30s"], Trailers: ["Teaser"] },
  },
};

// ------------------------------------
// Helpers
// ------------------------------------
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isNonEmptyObject = (o) =>
  o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length > 0;

// -----------------------------
// Public API (Data Layer)
// -----------------------------

/**
 * Load panel-specific categories (Firestore → LS → seed), cache, notify.
 * @param {'closet'|'voice'|'episodes'|string} panel
 * @returns {Promise<{categories:any, map:any}>}
 */
export async function loadCategories(panel) {
  const tree = await fetchTree(panel);
  const filtered = filterDeleted(tree);
  const flatMap = buildMap(filtered);
  cache.set(panel, { tree: filtered, map: flatMap });
  notify(panel);
  return getCategories(panel);
}

/** Latest snapshot from memory (shape used by smart-dropdown). */
export function getCategories(panel) {
  const snap = cache.get(panel) || { tree: {}, map: {} };
  return { categories: snap.tree, map: snap.map };
}

/** Subscribe to updates; fires immediately with current state. */
export function onCategories(panel, cb) {
  let set = subs.get(panel);
  if (!set) { set = new Set(); subs.set(panel, set); }
  set.add(cb);
  try { cb(getCategories(panel)); } catch (e) { console.error(e); }
  return () => subs.get(panel)?.delete(cb);
}

/** Add a category node at `path` with `label`. */
export async function addCategory(panel, path, label) {
  if (!Array.isArray(path)) throw new Error("path must be an array");
  if (!label) throw new Error("label is required");

  const { tree } = await requireState(panel);
  mutateTree(tree, path, (parent) => {
    if (parent[label]) throw new Error(`'${label}' already exists at ${join(path) || "root"}`);
    parent[label] = {};
  });

  await persistPanel(panel, tree, path);
  finalize(panel, tree);
}

/** Soft-delete node at `path` (only if it has no active children). */
export async function deleteCategory(panel, path) {
  if (!Array.isArray(path) || path.length === 0) throw new Error("path must target a node");

  const { tree } = await requireState(panel);
  mutateTree(tree, path.slice(0, -1), (parent) => {
    const key = path[path.length - 1];
    const node = parent[key];
    if (!node) throw new Error(`Path not found: ${join(path)}`);

    const activeChildren = Object.entries(node)
      .filter(([k, v]) => isCategoryKey(k) && v && !v.isDeleted);
    if (activeChildren.length > 0) throw new Error("This category has sub-items and cannot be deleted.");

    parent[key] = { ...(node || {}), isDeleted: true };
  });

  await persistPanel(panel, tree, path);
  finalize(panel, tree);
}

/** Rename node at `path` to `newLabel` (copy → soft-delete old). */
export async function renameCategory(panel, path, newLabel) {
  if (!Array.isArray(path) || path.length === 0) throw new Error("path must target a node");
  if (!newLabel) throw new Error("newLabel is required");

  const { tree } = await requireState(panel);
  mutateTree(tree, path.slice(0, -1), (parent) => {
    const oldKey = path[path.length - 1];
    const node = parent[oldKey];
    if (!node) throw new Error(`Path not found: ${join(path)}`);
    if (parent[newLabel]) throw new Error(`'${newLabel}' already exists at ${join(path.slice(0,-1)) || "root"}`);

    parent[newLabel] = node;                              // move subtree
    parent[oldKey] = { ...(parent[oldKey] || {}), isDeleted: true }; // soft-delete
  });

  await persistPanel(panel, tree, path);
  finalize(panel, tree);
}

// -----------------------------
// Internals (Data Layer)
// -----------------------------

async function requireState(panel) {
  let s = cache.get(panel);
  if (!s) {
    await loadCategories(panel);
    s = cache.get(panel);
  }
  if (!s) throw new Error(`[CategoryStore] State not initialized for panel: ${panel}`);
  return /** @type {PanelState} */ (s);
}

/** Fetch full tree from Firestore; LS or seed fallback on error/empty. */
async function fetchTree(panelRaw) {
  const panel = panelRaw === "episode" ? "episodes" : panelRaw;

  try {
    const colRef = collection(db, `${ROOT}/${panel}/items`);
    const snap = await getDocs(colRef);
    const topLevel = {};
    snap.forEach((d) => { topLevel[d.id] = d.data() || {}; });

    // Prefer Firestore if non-empty; otherwise use non-empty LS; otherwise seed
    const fromFS   = isNonEmptyObject(topLevel) ? topLevel : null;
    const lsObj    = safeReadLS(LS_KEY(panel));
    const fromLS   = isNonEmptyObject(lsObj) ? lsObj : null;
    const fromSeed = DEFAULT_SEED[panel] || {};
    const result   = fromFS || fromLS || fromSeed;

    safeWriteLS(LS_KEY(panel), result);
    return result;
  } catch (err) {
    console.warn(`[CategoryStore] Firestore load failed for '${panel}', using local fallback.`, err);
    const lsObj = safeReadLS(LS_KEY(panel));
    return isNonEmptyObject(lsObj) ? lsObj : (DEFAULT_SEED[panel] || {});
  }
}

function safeReadLS(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function safeWriteLS(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch {}
}

/** Persist the affected top-level documents for a panel. */
async function persistPanel(panel, tree, path) {
  const topKeys = changedTopKeys(path, tree);
  const colRef = collection(db, `${ROOT}/${panel}/items`);
  await Promise.all(
    topKeys.map(async (topKey) => {
      const data = tree[topKey] || {};
      await setDoc(doc(colRef, topKey), data);
    })
  );
  safeWriteLS(LS_KEY(panel), tree);
}

/** Determine which top-level docs to write. */
function changedTopKeys(path, tree) {
  if (!Array.isArray(path) || path.length === 0) return Object.keys(tree);
  return [path[0]];
}

/** Apply a mutation function to the object at `path`. */
function mutateTree(tree, path, mutator) {
  if (path.length === 0) { mutator(tree); return; }
  const top = path[0];
  if (!tree[top]) tree[top] = {};
  let cursor = tree[top];
  for (let i = 1; i < path.length; i++) {
    const key = path[i];
    if (!cursor[key]) cursor[key] = {};
    cursor = cursor[key];
  }
  mutator(cursor);
}

/** Remove nodes flagged as isDeleted (recursing only into plain objects). */
function filterDeleted(node) {
  // Arrays/primitives pass through untouched
  if (!isPlainObject(node)) return node;

  const out = {};
  for (const [k, v] of Object.entries(node || {})) {
    if (k === "isDeleted") continue;               // drop delete flag
    if (isPlainObject(v) && v.isDeleted) continue; // skip soft-deleted objects
    out[k] = filterDeleted(v);                     // recurse only into objects
  }
  return out;
}

/** Build a flat map of "A/B/C" -> nodeRef, only descending into plain objects. */
function buildMap(tree) {
  const map = {};
  const walk = (node, trail = []) => {
    if (!isPlainObject(node)) return;              // only descend into objects
    for (const [k, v] of Object.entries(node)) {
      if (k === "isDeleted") continue;
      const p = [...trail, k];
      map[p.join("/")] = v;
      if (isPlainObject(v)) walk(v, p);            // don’t recurse into arrays/primitives
    }
  };
  walk(tree);
  return map;
}

function isCategoryKey(k) { return k !== "isDeleted"; }
function join(path) { return path.join("/"); }

/** Notify subscribers with latest payload. */
function notify(panel) {
  const payload = getCategories(panel);
  (subs.get(panel) || new Set()).forEach((cb) => {
    try { cb(payload); } catch (e) { console.error("[CategoryStore] subscriber error", e); }
  });
}

/** Recompute cache from tree and notify. */
function finalize(panel, newTree) {
  const filtered = filterDeleted(newTree);
  const flatMap = buildMap(filtered);
  cache.set(panel, { tree: filtered, map: flatMap });
  notify(panel);
}

// ---------------------------------------------------------------------------
// (Optional) UI helper if you ever want to wire selects manually
// ---------------------------------------------------------------------------

function getSelect(id) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLSelectElement)) {
    throw new Error(`[CategoryStore] Expected <select id="${id}">, got ${el ? el.tagName : "null"}`);
  }
  return el;
}

/**
 * Wire three-level dropdowns using the store’s API (manual mode).
 * @param {'closet'|'voice'|'episode'|'episodes'} panel
 * @param {string} prefix e.g., 'closet-', 'voice-', 'episode-'
 * @returns {Promise<() => void | undefined>} unsubscribe
 */
export async function loadCategoryData(panel, prefix) {
  const panelKey = panel === "episode" ? "episodes" : panel;

  const catEl  = getSelect(`${prefix}category`);
  const subEl  = getSelect(`${prefix}subcategory`);
  const sub2El = getSelect(`${prefix}subsubcategory`);

  await loadCategories(panelKey);
  const unsub = onCategories(panelKey, ({ categories }) => {
    renderTopLevel(categories, catEl);
    syncChildren(categories, catEl, subEl, sub2El);
  });

  catEl.addEventListener("change", () => {
    const { categories } = getCategories(panelKey);
    syncChildren(categories, catEl, subEl, sub2El);
  });

  subEl.addEventListener("change", () => {
    const { categories } = getCategories(panelKey);
    renderSubs2(categories, catEl.value, subEl.value, sub2El);
  });

  return unsub;
}

function renderTopLevel(tree, catEl) {
  const prev = catEl.value;
  setOptions(catEl, Object.keys(tree));
  if (prev && tree[prev]) catEl.value = prev;
}
function syncChildren(tree, catEl, subEl, sub2El) {
  const top = tree[catEl.value] || {};
  const prev = subEl.value;
  setOptions(subEl, Object.keys(top));
  if (prev && top[prev]) subEl.value = prev;
  renderSubs2(tree, catEl.value, subEl.value, sub2El);
}
function renderSubs2(tree, cat, sub, sub2El) {
  const lvl2 = (tree[cat] || {})[sub] || {};
  const prev = sub2El.value;
  setOptions(sub2El, Object.keys(lvl2));
  if (prev && lvl2[prev]) sub2El.value = prev;
}
function setOptions(selectEl, items) {
  selectEl.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "";
  selectEl.appendChild(empty);
  for (const k of items) {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    selectEl.appendChild(opt);
  }
}

// ---------------------------------------------------------------------------
// Seeding helpers (the “small helper”) 🚀
// ---------------------------------------------------------------------------

/**
 * Seed a panel from DEFAULT_SEED into Firestore (top-level docs),
 * also writes to localStorage and refreshes the in-memory cache.
 * By default, skips if the panel already has Firestore docs.
 * @param {'closet'|'voice'|'episode'|'episodes'} panelRaw
 * @param {{ overwrite?: boolean }} [opts]
 * @returns {Promise<{ok:boolean, skipped?:boolean, reason?:string}>}
 */
export async function seedPanelFromDefaults(panelRaw, opts = {}) {
  const { overwrite = false } = opts;
  const panel = panelRaw === "episode" ? "episodes" : panelRaw;
  const seed = DEFAULT_SEED[panel];
  if (!seed) return { ok: false, reason: `No DEFAULT_SEED for panel '${panel}'` };

  const colRef = collection(db, `${ROOT}/${panel}/items`);
  const snap = await getDocs(colRef);

  if (!overwrite && !snap.empty) {
    return { ok: true, skipped: true, reason: "Existing Firestore data present; not overwriting" };
  }

  // Write each top-level category as its own document
  const keys = Object.keys(seed);
  await Promise.all(keys.map((k) => setDoc(doc(colRef, k), seed[k])));

  // Persist to LS and refresh cache/subscribers
  safeWriteLS(LS_KEY(panel), seed);
  await loadCategories(panel);

  return { ok: true };
}

/** Seed all known panels (closet, voice, episodes). */
export async function seedAllPanels(opts) {
  await seedPanelFromDefaults("closet", opts);
  await seedPanelFromDefaults("voice", opts);
  await seedPanelFromDefaults("episodes", opts);
}

/** Clear in-memory + LS for a panel (does not touch Firestore). */
export function clearPanelCache(panelRaw) {
  const panel = panelRaw === "episode" ? "episodes" : panelRaw;
  cache.delete(panel);
  try { localStorage.removeItem(LS_KEY(panel)); } catch {}
}
