// js/firebase-upload.js
// Module-based Firebase SDK (no CDN)
// If this file lives in /src/js/, the path below is correct.
// Adjust the ../ as needed for your project structure.
import { db, storage } from '../../utils/firebase-client.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

// 📤 Upload to Firebase Storage
export async function uploadFile(file, path) {
  const storageRef = ref(storage, `${path}/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// 🧾 Save metadata to Firestore
export async function saveFileMetadata(type, metadata) {
  const colRef = collection(db, type);
  await addDoc(colRef, metadata);
}
