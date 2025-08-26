// src/utils/theme-service.js
import { db } from "@/utils/init-firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Fallback themes used if Firestore doc missing (safe defaults)
export const BUILTIN_THEMES = {
  Lavender: {
    label: "Lavender",
    type: "gradient",
    colors: ["#f4ecff", "#eadfff"],
    angle: 90,
    radius: 20,
    shadow: 12,
    marginPct: 0.10,
    biasY: 0.03,
  },
  Blush: {
    label: "Blush",
    type: "gradient",
    colors: ["#fff7fb", "#ffe6f2"],
    angle: 90,
    radius: 20,
    shadow: 10,
    marginPct: 0.10,
    biasY: 0.03,
  },
  Graphite: {
    label: "Graphite",
    type: "solid",
    colors: ["#f7f7f8"], // first color used
    angle: 0,
    radius: 20,
    shadow: 8,
    marginPct: 0.10,
    biasY: 0.02,
  },
};

export function mergeTheme(base, overrides) {
  if (!overrides) return base;
  const out = { ...base };
  for (const k of Object.keys(overrides)) out[k] = overrides[k];
  return out;
}

export async function getThemeById(themeId) {
  if (!themeId) return BUILTIN_THEMES.Lavender;
  try {
    const snap = await getDoc(doc(db, `public/themes/${themeId}`));
    if (snap.exists()) return { ...BUILTIN_THEMES[themeId], ...snap.data() };
  } catch {}
  return BUILTIN_THEMES[themeId] || BUILTIN_THEMES.Lavender;
}

/**
 * Resolves an *effective* theme for a user:
 *   1) public/themes/{themeId} (or builtin)
 *   2) apply users/{uid}/settings/brand.overrides if present
 */
export async function getEffectiveThemeForUser(uid, preferredThemeId) {
  let base = await getThemeById(preferredThemeId || "Lavender");
  try {
    const brandSnap = await getDoc(doc(db, `users/${uid}/settings/brand`));
    if (brandSnap.exists()) {
      const { themeId, overrides } = brandSnap.data() || {};
      const lib = await getThemeById(themeId || preferredThemeId || base?.label || "Lavender");
      base = mergeTheme(lib, overrides);
    }
  } catch {}
  return base || BUILTIN_THEMES.Lavender;
}

/** Live listener (if you want UI that updates as admin edits themes) */
export function listenEffectiveTheme(uid, preferredThemeId, cb) {
  let off1, off2;
  const brandRef = doc(db, `users/${uid}/settings/brand`);
  off1 = onSnapshot(brandRef, async (brandSnap) => {
    const data = brandSnap.data() || {};
    const themeId = data.themeId || preferredThemeId || "Lavender";
    const overrides = data.overrides || null;
    // live theme ref
    const tRef = doc(db, `public/themes/${themeId}`);
    if (off2) off2();
    off2 = onSnapshot(tRef, (tSnap) => {
      const lib = (tSnap.exists() ? tSnap.data() : BUILTIN_THEMES[themeId]) || BUILTIN_THEMES.Lavender;
      cb(mergeTheme(lib, overrides));
    }, () => cb(mergeTheme(BUILTIN_THEMES[themeId], overrides)));
  }, async () => {
    const theme = await getThemeById(preferredThemeId || "Lavender");
    cb(theme);
  });

  return () => { off1?.(); off2?.(); };
}
