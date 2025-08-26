import { db } from "@/utils/init-firebase";
import { setDoc, doc, collection, getDocs, serverTimestamp } from "firebase/firestore";

export async function saveUserPanel(uid, panel) {
  const ref = panel.id
    ? doc(db, `users/${uid}/panels/${panel.id}`)
    : doc(collection(db, `users/${uid}/panels`));
  const body = {
    title: panel.title || "Untitled Panel",
    type: panel.type || "custom",
    blocks: panel.blocks || [],
    themeId: panel.themeId || null,
    previewUrl: panel.previewUrl || null,
    bytesEst: JSON.stringify(panel).length,
    updatedAt: serverTimestamp(),
    createdAt: panel.createdAt || serverTimestamp(),
  };
  await setDoc(ref, body, { merge: true });
  return ref.id;
}

export async function listUserPanels(uid) {
  const snap = await getDocs(collection(db, `users/${uid}/panels`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
