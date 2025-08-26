import { useRef, useState } from "react";
import { db } from "@/utils/init-firebase";
import {
  addDoc, collection, doc, increment, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { processImageBlob } from "@/utils/image-pipeline";
import { uploadFileWithProgress } from "@/utils/firebase-helpers";

/**
 * All logic for the left Upload panel (drag/drop, process, progress, upload).
 *
 * Usage:
 * const up = useUploadToSpace({ uid, spaceId, catId, folderId });
 * <input type="file" onChange={e => up.pick(e.target.files?.[0])} />
 * <Drop onDrop={up.drop} />
 * <button disabled={!up.ready || up.pct>0} onClick={up.upload}>Upload</button>
 */
export default function useUploadToSpace({ uid, spaceId, catId, folderId }) {
  const processedRef = useRef(null);
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);

  async function pick(file) {
    if (!file) return;
    setReady(false);
    setPct(0);
    setFileName(file.name || "image.png");

    const out = await processImageBlob(file, {
      smartCompress: true,
      trimBg: false,
      padToSquare: true,
      preferServer: true,
      exportPreview: true,
      exportIcon: true,
      exportIconHover: true,
    });

    processedRef.current = out;
    setReady(true);
    if (!title) {
      const base = (file.name || "").replace(/\.[^.]+$/, "");
      setTitle(base || `File ${new Date().toLocaleString()}`);
    }
  }

  function clear() {
    processedRef.current = null;
    setReady(false);
    setPct(0);
    setFileName("");
    setTitle("");
  }

  async function upload() {
    const P = processedRef.current;
    if (!uid || !spaceId) throw new Error("Missing uid/spaceId");
    if (!P?.cutoutBlob) throw new Error("No file selected");

    setPct(1);

    const res = await uploadFileWithProgress(P.cutoutBlob, {
      slug: "spaces",
      public: false,
      uiPrefix: "space-upload",
      onProgress: (v) => setPct(Math.round(v || 0)),
      metadata: {
        uid,
        spaceId,
        catId: catId || "",
        folderId: folderId || "",
        title: title || "Item",
        contentType: "image/png",
        cacheControl: "public,max-age=31536000",
      },
      extraUploads: [
        { key: "preview",   blob: P.previewBlob,   contentType: "image/jpeg" },
        { key: "icon",      blob: P.iconBlob,      contentType: "image/png"  },
        { key: "iconHover", blob: P.iconHoverBlob, contentType: "image/png"  },
      ],
    });

    const fileUrl    = res?.downloadURL || res?.url || res?.assets?.file?.url || "";
    const previewUrl = res?.assets?.preview?.url || "";

    // choose target collection
    let targetCol;
    if (catId && folderId) {
      targetCol = collection(db, `users/${uid}/spaces/${spaceId}/categories/${catId}/folders/${folderId}/items`);
    } else if (catId) {
      targetCol = collection(db, `users/${uid}/spaces/${spaceId}/categories/${catId}/items`);
    } else {
      targetCol = collection(db, `users/${uid}/spaces/${spaceId}/items`);
    }

    await addDoc(targetCol, {
      uid, spaceId,
      catId: catId || null,
      folderId: folderId || null,
      title: title || null,
      fileName: res?.fileName || fileName || null,
      fileUrl: fileUrl || null,
      previewUrl: previewUrl || null,
      storagePath: res?.fullPath || null,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // keep Space summary fresh
    await updateDoc(doc(db, `users/${uid}/spaces/${spaceId}`), {
      fileCount: increment(1),
      updatedAt: serverTimestamp(),
      lastPreviewUrl: previewUrl || fileUrl || null,
    });

    clear();
  }

  // Simple helpers for drop areas
  function drop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) pick(f);
  }

  return {
    title, setTitle,
    fileName, pct, ready,
    pick, drop, clear, upload,
  };
}
