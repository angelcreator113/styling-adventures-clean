// imports (replace)
import { db } from './init-firebase.js';
import {
  getDoc, getDocs, collection, doc, query, where
} from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';


// 🔍 Get all closet items (basic metadata only)
export async function getAllClosetItems() {
  const snapshot = await getDocs(collection(db, "closetUploads"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 🔄 Load items with URLs (for rendering images)
export async function loadClosetItemsFromFirestore() {
  const snapshot = await getDocs(collection(db, "closetUploads"));
  const items = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const path = `closet/${data.category}/${data.subcategory}/${data.filename}`;
    try {
      const url = await getDownloadURL(storageRef(storage, path));
      items.push({ id: docSnap.id, ...data, url });
    } catch (err) {
      console.warn(`⚠️ Missing file: ${data.filename} at ${path}`);
      items.push({ id: docSnap.id, ...data, url: 'images/missing-thumbnail.png' });
    }
  }

  return items;
}

// ✏️ Update a closet item
export async function updateClosetItem(id, data) {
  const itemRef = doc(db, "closetUploads", id);
  await updateDoc(itemRef, data);
}

// 🗑 Delete a closet item
export async function deleteClosetItem(id) {
  const itemRef = doc(db, "closetUploads", id);
  await deleteDoc(itemRef);
}
