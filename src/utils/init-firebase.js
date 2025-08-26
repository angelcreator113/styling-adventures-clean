// src/utils/init-firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore, // lets us force long-polling in dev
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { firebaseConfig } from '@/firebase/firebase-config';

// Reuse existing app in dev to avoid duplicate inits
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Core SDKs
export const auth = getAuth(app);

// Optional: force long-polling in dev if you have env set
const forceLP =
  String(import.meta.env.VITE_FIRESTORE_LONG_POLLING || '').toLowerCase() === 'true';

export const db = forceLP
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);

export const storage = getStorage(app);

/**
 * Wait for the initial auth user (or null).
 * Usage: const user = await authReady();
 */
export function authReady() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(
      auth,
      (user) => {
        stop();
        resolve(user || null);
      },
      () => {
        stop();
        resolve(null);
      }
    );
  });
}

// Convenience: a ready-made Promise some places may await directly
export const authReadyPromise = authReady();

// ✅ Back-compat alias for older imports
export { authReady as onAuthReady };
