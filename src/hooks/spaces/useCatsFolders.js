import { useEffect, useState } from "react";
import { db } from "@/utils/init-firebase";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";

/**
 * Categories & Folders under a Space.
 * Returns arrays + create helpers (promises).
 */
export default function useCatsFolders(uid, spaceId, catId) {
  const [cats, setCats] = useState([]);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    if (!uid || !spaceId) { setCats([]); return; }
    const qq = query(collection(db, `users/${uid}/spaces/${spaceId}/categories`), orderBy("createdAt", "asc"));
    return onSnapshot(qq, (snap) => setCats(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [uid, spaceId]);

  useEffect(() => {
    if (!uid || !spaceId || !catId) { setFolders([]); return; }
    const qq = query(collection(db, `users/${uid}/spaces/${spaceId}/categories/${catId}/folders`), orderBy("createdAt","asc"));
    return onSnapshot(qq, (snap) => setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [uid, spaceId, catId]);

  async function addCategory(title) {
    if (!uid || !spaceId || !title) return;
    return addDoc(collection(db, `users/${uid}/spaces/${spaceId}/categories`), {
      title: title.trim(),
      createdAt: serverTimestamp(),
    });
  }

  async function addFolder(catIdArg, title) {
    const cid = catIdArg || catId;
    if (!uid || !spaceId || !cid || !title) return;
    return addDoc(collection(db, `users/${uid}/spaces/${spaceId}/categories/${cid}/folders`), {
      title: title.trim(),
      createdAt: serverTimestamp(),
    });
  }

  return { cats, folders, addCategory, addFolder };
}
