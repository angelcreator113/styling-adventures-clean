// scripts/dedupeCloset.js (admin-only utility)
import { db } from "@/utils/init-firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

export async function dedupeClosetFor(uid) {
  const col = collection(db, `users/${uid}/closet`);
  const snap = await getDocs(col);
  const byPath = new Map();
  const toDelete = [];

  snap.docs.forEach(d => {
    const data = d.data();
    const key = data.storagePath || data.originalUrl || data.fileName || d.id;
    const prev = byPath.get(key);
    if (!prev) byPath.set(key, d);
    else {
      // keep the lexicographically later id (usually newer) or change to timestamp compare
      const keep = prev.id > d.id ? prev : d;
      const drop = prev.id > d.id ? d : prev;
      byPath.set(key, keep);
      toDelete.push(drop);
    }
  });

  for (const d of toDelete) await deleteDoc(doc(db, d.ref.path));
  return { kept: byPath.size, deleted: toDelete.length };
}
