// src/utils/waitForFirebase.js
import { authReady, db } from '@/utils/init-firebase';

// Resolve once Firebase auth has produced the initial user (or null).
// Also publish a tiny global + event for backwards compatibility.
export async function waitForFirebase(timeoutMs = 6000) {
  const race = Promise.race([
    (async () => {
      await authReady();               // <- rely on your real init
      try {
        // old code may look for these:
        window.firebaseRefs = window.firebaseRefs || {};
        window.firebaseRefs.db = db;
        window.dispatchEvent?.(new Event('firebase-ready'));
      } catch {}
      return true;
    })(),
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`[waitForFirebase] timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);

  return race.catch((e) => {
    // Don’t hard-crash panels if this happens — just log.
    console.warn(e.message || e);
  });
}
