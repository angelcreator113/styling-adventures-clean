// src/pages/creator/spaces/UploadOverlay.jsx
import React, { useRef, useState } from "react";
import { db } from "@/utils/init-firebase";
import {
  addDoc, collection, serverTimestamp, updateDoc, doc, increment
} from "firebase/firestore";
import { processImageBlob } from "@/utils/image-pipeline";
import { uploadFileWithProgress } from "@/utils/firebase-helpers";

const PFX = "space-detail-";

export default function UploadOverlay({ uid, spaceId, catId, folderId, onClose }) {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(`File ${new Date().toLocaleString()}`);
  const procRef = useRef(null);

  async function onPick(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const out = await processImageBlob(f, {
        smartCompress: true,
        trimBg: false,      // creators: off
        padToSquare: true,
        preferServer: true,
        exportPreview: true,
        exportIcon: true,
        exportIconHover: true,
      });
      procRef.current = out;
    } catch (err) {
      console.warn("[spaces] process failed", err);
      alert("Couldn’t process that file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload() {
    const P = procRef.current;
    if (!uid || !spaceId || !P?.cutoutBlob) return alert("Choose a file first.");
    setBusy(true);
    try {
      const res = await uploadFileWithProgress(P.cutoutBlob, {
        slug: "spaces",
        public: false,
        uiPrefix: PFX,
        metadata: {
          uid, spaceId, catId: catId || "", folderId: folderId || "",
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

      let targetCol;
      if (catId && folderId) {
        targetCol = collection(db, `users/${uid}/spaces/${spaceId}/categories/${catId}/folders/${folderId}/items`);
      } else if (catId) {
        targetCol = collection(db, `users/${uid}/spaces/${spaceId}/categories/${catId}/items`);
      } else {
        targetCol = collection(db, `users/${uid}/spaces/${spaceId}/items`);
      }

      await addDoc(targetCol, {
        uid, spaceId, catId: catId || null, folderId: folderId || null,
        title: title || null,
        fileName: res?.fileName || null,
        fileUrl: fileUrl || null,
        previewUrl: previewUrl || null,
        storagePath: res?.fullPath || null,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, `users/${uid}/spaces/${spaceId}`), {
        fileCount: increment(1),
        updatedAt: serverTimestamp(),
        lastPreviewUrl: previewUrl || fileUrl || null,
      });

      onClose();
    } catch (err) {
      console.warn("[spaces] upload failed", err);
      alert("Upload failed. See console.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal__hd"><h3 className="modal__title">Upload to Space</h3></div>
        <div className="modal__bd">
          <div
            id={`${PFX}drop`}
            onClick={() => document.getElementById(`${PFX}file-input`)?.click()}
            style={{
              border: "2px dashed #e5d9ff", background: "#f8f5ff",
              height: 220, borderRadius: 14, display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >
            <input id={`${PFX}file-input`} type="file" accept="image/*" hidden onChange={onPick} />
            <div style={{ color: "#7c3aed", fontWeight: 600 }}>
              {procRef.current ? "Ready to Upload" : "Choose a file…"}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <label className="input">
              <div className="input__label">Title (optional)</div>
              <input
                className="input__field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a name…"
              />
            </label>

            <div className="muted" style={{ fontSize: 12 }}>
              Advanced defaults for Creator Spaces: background remover OFF; uploads are private to you.
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="btn primary" onClick={handleUpload} disabled={busy || !procRef.current}>
                {busy ? "Uploading…" : "Upload"}
              </button>
              <button className="btn" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
