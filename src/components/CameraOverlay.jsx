import React, { useEffect, useRef, useState } from "react";

export default function CameraOverlay({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const [facing, setFacing] = useState("environment");
  const [shot, setShot] = useState(null); // blob preview

  useEffect(() => {
    if (!open) return;
    let stream;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing }, audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        alert("Camera unavailable"); onClose?.();
      }
    };
    start();
    return () => stream && stream.getTracks().forEach(t => t.stop());
  }, [open, facing, onClose]);

  async function take() {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob((b) => setShot(b), "image/jpeg", 0.92);
  }

  function retake() { setShot(null); }
  function flip() { setFacing((p) => (p === "environment" ? "user" : "environment")); }
  function usePhoto() { if (shot) onCapture?.(shot); onClose?.(); }

  if (!open) return null;
  return (
    <div className="cam-ovl">
      <div className="cam-box">
        {!shot ? (
          <video ref={videoRef} playsInline muted className="cam-video" />
        ) : (
          <img src={URL.createObjectURL(shot)} alt="" className="cam-shot" />
        )}
        <div className="cam-ctrl">
          {!shot ? (
            <>
              <button className="btn" onClick={flip}>Flip</button>
              <button className="btn primary" onClick={take}>Capture</button>
              <button className="btn" onClick={onClose}>Close</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={retake}>Retake</button>
              <button className="btn primary" onClick={usePhoto}>Use Photo</button>
              <button className="btn" onClick={flip}>Flip</button>
            </>
          )}
        </div>
      </div>
      <style>{`
        .cam-ovl{position:fixed;inset:0;background:rgba(20,33,54,.6);display:grid;place-items:center;z-index:1200}
        .cam-box{width:min(720px,92vw);aspect-ratio:3/4;background:#000;border-radius:16px;overflow:hidden;position:relative}
        .cam-video,.cam-shot{width:100%;height:100%;object-fit:cover;display:block}
        .cam-ctrl{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;justify-content:center;padding:10px;background:linear-gradient(to top,rgba(0,0,0,.4),transparent)}
        .btn{height:40px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff}
        .btn.primary{background:#84D2F6;border-color:#84D2F6;color:#142136;font-weight:700}
      `}</style>
    </div>
  );
}
