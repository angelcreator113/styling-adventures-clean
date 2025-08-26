// src/lib/storage.ts
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // e.g. project-id.appspot.com
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
// If you’re using the additional bucket instead of the default, do this:
// export const storage = getStorage(app, 'gs://styling-admin.firebasestorage.app');
export const storage = getStorage(app);

export async function uploadFile(file: File) {
  const key = `uploads/${crypto.randomUUID()}-${file.name}`;
  const r = ref(storage, key);
  const snap = await uploadBytes(r, file);       // requires auth if your rules do
  const url = await getDownloadURL(snap.ref);
  return { key, url };
}
