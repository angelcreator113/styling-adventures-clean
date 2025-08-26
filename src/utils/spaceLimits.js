import { db, auth } from "@/utils/init-firebase";
import { doc, getDoc, collection, getCountFromServer } from "firebase/firestore";

/**
 * Reads the effective limits and current count for the signed-in user.
 * - Global: app_settings/spaces.maxSpacesGlobal
 * - Per-user override: users/{uid}/settings/limits.maxSpaces
 * - Current count: users/{uid}/spaces (document count)
 */
export async function getSpaceLimitsAndUsage(uid = auth.currentUser?.uid) {
  if (!uid) return { current: 0, max: 0, ok: false };

  const [globalSnap, userLimitSnap, countSnap] = await Promise.all([
    getDoc(doc(db, "app_settings", "spaces")),
    getDoc(doc(db, `users/${uid}/settings/limits`)),
    getCountFromServer(collection(db, `users/${uid}/spaces`)),
  ]);

  const globalMax = Number(globalSnap.data()?.maxSpacesGlobal ?? 0);
  const userMax   = Number(userLimitSnap.data()?.maxSpaces ?? 0);

  const max = userMax > 0 ? userMax : globalMax; // per-user overrides global when set
  const current = countSnap.data().count || 0;

  return { current, max, ok: max === 0 || current < max, globalMax, userMax };
}

/** Convenience: boolean check only */
export async function canCreateAnotherSpace(uid) {
  const { ok } = await getSpaceLimitsAndUsage(uid);
  return ok;
}
