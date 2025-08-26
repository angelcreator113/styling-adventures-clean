// src/components/spaces/UploadModal.jsx
import React, { useRef, useState } from "react";
import { processImageBlob } from "@/utils/image-pipeline";
import { uploadFileWithProgress } from "@/utils/firebase-helpers";

export default function UploadModal({ open, onClose, onDone, spaceId, catId, folderId, uid }) {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const refProcessed = useRef(null);

  if (!open) return null;

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) ingest(f);
  };

  async function ingest(file) {
    setBusy(true);
    try {
      // Creator defaults: NO bg removal, NOT public
      const out = await processImageBlob(file, {
        smartCompress: true,
        trimBg: false,
        padToSquare: true,
        preferServer: true,
        exportPreview: true,
        exportIcon: true,
        exportIconHover: true,
      });
      refProcessed.current = out;
      setPreviewUrl(out.previewUrl);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/,""));
    } finally { setBusy(false); }
  }

  async function save() {
    const P = refProcessed.current;
    if (!P?.cutoutBlob) return;

    setBusy(true);
    try {
      const res = await uploadFileWithProgress(P.cutoutBlob, {
        slug: "spaces",
        public: false,                 // creator default
        onProgress: () => {},
        metadata: {
          uid, spaceId, catId: catId || "", folderId: folderId || "",
          title: title || "Item", contentType: "image/png",
          cacheControl: "public,max-age=31536000",
        },
        extraUploads: [
          { key: "preview",   blob: P.previewBlob,   contentType: "image/jpeg" },
          { key: "icon",      blob: P.iconBlob,      contentType: "image/png"  },
          { key: "iconHover", blob: P.iconHoverBlob, contentType: "image/png"  },
        ],
      });

      onDone?.({
        fileUrl: res?.assets?.file?.url || res?.downloadURL || "",
        previewUrl: res?.assets?.preview?.url || "",
        fileName: res?.fileName || "",
      });
      onClose?.();
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Upload to Space">
      <div className="modal">
        <h3>Upload to Space</h3>

        <div className="drop" onClick={()=>document.getElementById("space-file").click()}>
          <input id="space-file" type="file" accept="image/*" hidden onChange={pick}/>
          {previewUrl ? <img alt="" src={previewUrl} style={{maxWidth:"100%", borderRadius:12}}/> : "Choose a file…"}
        </div>

        <details style={{ marginTop: 8 }}>
          <summary>Advanced</summary>
          <div className="muted" style={{marginTop:6}}>Creator uploads don’t remove background or set public by default.</div>
        </details>

        <label className="input" style={{marginTop:8}}>
          <div className="input__label">Title (optional)</div>
          <input className="input__field" value={title} onChange={e=>setTitle(e.target.value)} />
        </label>

        <div className="row" style={{gap:8, marginTop:12}}>
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy || !refProcessed.current}>
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
