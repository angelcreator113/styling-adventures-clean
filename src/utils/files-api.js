// src/utils/files-api.js
import { auth, db } from "@/utils/init-firebase";
import {
  addDoc, setDoc, updateDoc, deleteDoc, doc, collection, query,
  orderBy, onSnapshot, serverTimestamp
} from "firebase/firestore";

function rootPath(scope, uid) {
  if (scope === "admin") return "contentFiles";
  const id = uid || auth.currentUser?.uid;
  if (!id) throw new Error("No user");
  return `users/${id}/files`;
}

export function listenCategories({ scope = "user", uid, onChange }) {
  const base = rootPath(scope, uid);
  const qy = query(collection(db, base), orderBy("order", "asc"));
  return onSnapshot(qy, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange?.(rows);
  });
}
export async function createCategory({ scope="user", uid, label }) {
  const base = rootPath(scope, uid);
  const ref = await addDoc(collection(db, base), {
    label, order: Date.now(), createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return ref.id;
}
export async function renameCategory({ scope="user", uid, categoryId, label }) {
  const base = rootPath(scope, uid);
  await updateDoc(doc(db, base, categoryId), { label, updatedAt: serverTimestamp() });
}
export async function deleteCategory({ scope="user", uid, categoryId }) {
  const base = rootPath(scope, uid);
  await deleteDoc(doc(db, base, categoryId)); // NB: does not cascade; keep tiny-on-purpose
}

export function listenFolders({ scope="user", uid, categoryId, onChange }) {
  const base = rootPath(scope, uid);
  const qy = query(collection(db, `${base}/${categoryId}/folders`), orderBy("order","asc"));
  return onSnapshot(qy, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange?.(rows);
  });
}
export async function createFolder({ scope="user", uid, categoryId, label }) {
  const base = rootPath(scope, uid);
  const ref = await addDoc(collection(db, `${base}/${categoryId}/folders`), {
    label, order: Date.now(), createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return ref.id;
}
export async function renameFolder({ scope="user", uid, categoryId, folderId, label }) {
  const base = rootPath(scope, uid);
  await updateDoc(doc(db, `${base}/${categoryId}/folders/${folderId}`), { label, updatedAt: serverTimestamp() });
}
export async function deleteFolder({ scope="user", uid, categoryId, folderId }) {
  const base = rootPath(scope, uid);
  await deleteDoc(doc(db, `${base}/${categoryId}/folders/${folderId}`));
}

export function listenItems({ scope="user", uid, categoryId, folderId, onChange }) {
  const base = rootPath(scope, uid);
  const qy = query(collection(db, `${base}/${categoryId}/folders/${folderId}/items`), orderBy("createdAt","desc"));
  return onSnapshot(qy, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange?.(rows);
  });
}
export async function createItem({ scope="user", uid, categoryId, folderId, data }) {
  const base = rootPath(scope, uid);
  const ref = await addDoc(collection(db, `${base}/${categoryId}/folders/${folderId}/items`), {
    title: data?.title || "Untitled",
    notes: data?.notes || "",
    tags: data?.tags || [],
    url: data?.url || "",
    storagePath: data?.storagePath || "",
    bytes: data?.bytes || 0,
    contentType: data?.contentType || "",
    visibility: data?.visibility || "private",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateItem({ scope="user", uid, categoryId, folderId, itemId, data }) {
  const base = rootPath(scope, uid);
  await updateDoc(doc(db, `${base}/${categoryId}/folders/${folderId}/items/${itemId}`), {
    ...data, updatedAt: serverTimestamp()
  });
}
export async function deleteItem({ scope="user", uid, categoryId, folderId, itemId }) {
  const base = rootPath(scope, uid);
  await deleteDoc(doc(db, `${base}/${categoryId}/folders/${folderId}/items/${itemId}`));
}
