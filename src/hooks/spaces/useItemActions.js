// src/hooks/spaces/useItemActions.js
import { doc, serverTimestamp, updateDoc, writeBatch, increment } from "firebase/firestore";
import { db } from "@/utils/init-firebase";

export default function useItemActions(uid, spaceId) {
  async function renameItem(it) {
    if (!it?.ref) return;
    const current = (it.title || it.fileName || "Item").toString();
    const next = prompt("Rename item", current);
    if (!next || next.trim() === current) return;
    try {
      await updateDoc(it.ref, {
        title: next.trim(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[spaces] rename failed", e);
      alert("Rename failed.");
    }
  }

  async function toggleArchive(it) {
    if (!it?.ref) return;
    const newStatus = (it.status || "active") === "active" ? "archived" : "active";
    try {
      await updateDoc(it.ref, { status: newStatus, updatedAt: serverTimestamp() });
    } catch (e) {
      console.warn("[spaces] archive toggle failed", e);
      alert("Couldn’t update status.");
    }
  }

  async function deleteItem(it) {
    if (!it?.ref || !uid || !spaceId) return;
    if (!confirm("Delete this item?")) return;
    try {
      const b = writeBatch(db);
      b.delete(it.ref);
      b.update(doc(db, `users/${uid}/spaces/${spaceId}`), {
        fileCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      await b.commit();
    } catch (e) {
      console.warn("[spaces] delete failed", e);
      alert("Delete failed.");
    }
  }

  return { renameItem, toggleArchive, deleteItem };
}
