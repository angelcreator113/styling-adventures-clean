// src/components/upload/CameraOverlay.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { processImageBlob } from "@/utils/image-pipeline";

export default function CameraOverlay({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState("environment");
  const [trim, setTrim] = useState(true); // default ON

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing }, audio: false
        });
        if (!alive) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch (e) { console.warn("camera failed", e); }
    })();
    return () => {
      alive = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [open, facing]);

  const flip = () => setFacing(p => (p === "environment" ? "user" : "environment"));

  const capture = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const raw = await new Promise(r => c.toBlob(b => r(b), "image/jpeg", 0.92));
    const processed = await processImageBlob(raw, { trimBg: trim, square: false, compress: true });
    onCapture?.(processed);
  };

  if (!open) return null;

  return createPortal(
    <div className="cam-ovl" role="dialog" aria-modal="true">
      <div className="cam-sheet">
        <video ref={videoRef} playsInline muted />
        <div className="cam-toolbar">
          <label className="row" style={{ gap: 6 }}>
            <input type="checkbox" checked={trim} onChange={(e)=>setTrim(e.target.checked)} />
            Trim BG
          </label>
          <button className="tb-btn" onClick={flip}>Flip camera</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="tb-btn" onClick={onClose}>Retake / Close</button>
            <button className="tb-btn primary" onClick={capture}>Capture</button>
          </div>
        </div>
      </div>

      <style>{`
        .cam-ovl{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:1200}
        .cam-sheet{width:min(900px,92vw);background:#0b0b0c;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45)}
        .cam-sheet video{width:100%;max-height:70dvh;display:block;background:#000}
        .cam-toolbar{display:flex;align-items:center;gap:8px;padding:10px;background:#111;color:#fff;border-top:1px solid rgba(255,255,255,.08)}
        .tb-btn{color:#eee;background:#1e1e1f;border:1px solid #333}
        .tb-btn.primary{background:#6b3ce9;border-color:#5b2fe0}
      `}</style>
    </div>,
    document.body
  );
}
