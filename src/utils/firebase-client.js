// src/utils/firebase-client.js

// Ensure firebase is initialized on window
export function ready() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.firebaseRefs?.app) {
        resolve(window.firebaseRefs);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

// Export from window.firebaseRefs (already initialized)
export const app = window.firebaseRefs?.app;
export const auth = window.firebaseRefs?.auth;
export const db = window.firebaseRefs?.db;
export const storage = window.firebaseRefs?.storage;
