// src/components/upload/UploadPanelCore.jsx (skeleton)
import React, { useRef, useState } from "react";
import DropPicker from "./DropPicker.jsx";
import CameraOverlay from "./CameraOverlay.jsx";
import { processImageBlob } from "@/utils/image-pipeline"; // factor our helpers there
import { uploadFileWithProgress } from "@/utils/firebase-helpers";

export default function UploadPanelCore({ slug, features, onUploaded }) {
  const [showCam, setShowCam] = useState(false);
  const [file, setFile] = useState(null);
  const [pct, setPct] = useState(0);
  const busyRef = useRef(false);

  const handleFiles = async (files) => setFile(files?.[0] || null);

  const handleCapture = async (blob) => {
    const processed = await processImageBlob(blob, {
      trimBg: features.trim,
      brandComposite: features.brandbg,
      square: features.square,
    });
    setFile(new File([processed], features.trim ? "camera.png" : "camera.jpg", { type: processed.type }));
    setShowCam(false);
  };

  const upload = async () => {
    if (!file || busyRef.current) return;
    busyRef.current = true;
    try {
      const prepared =
        features.trim && file.type.startsWith("image/")
          ? new File(
              [await processImageBlob(file, { trimBg: true, brandComposite: features.brandbg, square: features.square })],
              file.name.replace(/\.\w+$/, "") + ".png",
              { type: "image/png" }
            )
          : file;

      await uploadFileWithProgress(prepared, {
        slug,
        public: features.public,
        uiPrefix: `${slug}-`,
        onProgress: (p) => setPct(p),
      });
      onUploaded?.();
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <>
      <DropPicker accept="image/*" onFiles={handleFiles} onOpenCamera={() => setShowCam(true)} />
      <button className="tb-btn primary" onClick={upload} disabled={!file}>Upload</button>

      <CameraOverlay open={showCam} onClose={() => setShowCam(false)} onCapture={handleCapture} />
      {pct > 0 && <div className="muted sm">{Math.round(pct)}%</div>}
    </>
  );
}
