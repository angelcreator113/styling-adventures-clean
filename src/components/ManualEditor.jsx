// src/components/ManualEditor.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Simple brush erase/restore editor:
 * - Left click = erase (transparent)
 * - Hold Alt/Option (or toggle Restore) = restore
 * - Undo steps stored in a small stack
 * Emits: dispatchEvent("bestie:manualProcess", { detail: { blob, uiPrefix } })
 */
export default function ManualEditor({ uiPrefix = "", onClose }) {
  const cvsRef = useRef(null);
  const imgRef = useRef(new Image());
  const [ready, setReady] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [brushSize, setBrushSize] = useState(26);
  const undoRef = useRef([]);

  // Load last blob (or let user pick)
  useEffect(() => {
    async function load() {
      let blob = window.__bestie_lastBlob || null;
      if (!blob) {
        // ask for a file quickly if no last blob
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = "image/*";
        inp.onchange = async (e) => {
          const f = e.target.files?.[0];
          if (f) await drawFile(f);
        };
        inp.click();
      } else {
        await drawFile(blob);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function drawFile(fileOrBlob) {
    const url = URL.createObjectURL(fileOrBlob);
    const img = imgRef.current;
    img.onload = () => {
      const cvs = cvsRef.current;
      if (!cvs) return;
      // fit image into canvas
      const maxW = Math.min(window.innerWidth - 80, 960);
      const scale = Math.min(1, maxW / img.width);
      cvs.width = Math.round(img.width * scale);
      cvs.height = Math.round(img.height * scale);
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      undoRef.current = [];
      pushUndo();
      setReady(true);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setReady(false);
    img.src = url;
  }

  function pushUndo() {
    const cvs = cvsRef.current; if (!cvs) return;
    try {
      const snap = cvs.toDataURL("image/png");
      undoRef.current.push(snap);
      if (undoRef.current.length > 20) undoRef.current.shift();
    } catch {}
  }

  function undo() {
    if (undoRef.current.length < 2) return;
    // pop current, draw previous
    undoRef.current.pop();
    const prev = undoRef.current[undoRef.current.length - 1];
    const img = new Image();
    img.onload = () => {
      const cvs = cvsRef.current; if (!cvs) return;
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
    };
    img.src = prev;
  }

  function paintAt(x, y, erase) {
    const cvs = cvsRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    if (!erase) {
      // restore by redrawing original pixels under the brush
      const tmp = document.createElement("canvas");
      tmp.width = cvs.width; tmp.height = cvs.height;
      const tctx = tmp.getContext("2d");
      tctx.drawImage(imgRef.current, 0, 0, cvs.width, cvs.height);
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(tmp, 0, 0);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function onPointer(e) {
    if (!ready) return;
    const cvs = cvsRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const erase = !e.altKey && !restoring; // default erase; Alt = restore
    paintAt(x, y, erase);
  }

  function onDown(e) {
    if (!ready) return;
    pushUndo();
    onPointer(e);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerup", onUp, { once: true });
  }
  function onUp() {
    window.removeEventListener("pointermove", onPointer);
  }

  async function applyAndContinue() {
    const cvs = cvsRef.current; if (!cvs) return;
    cvs.toBlob((blob) => {
      if (!blob) return;
      const ev = new CustomEvent("bestie:manualProcess", {
        detail: { blob, uiPrefix },
      });
      document.dispatchEvent(ev);
      onClose?.();
    }, "image/png");
  }

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true">
      <div className="card modal">
        <div className="card__body">
          <div className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="card__title" style={{ margin: 0 }}>Manual Editor</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <label className="tb-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={restoring} onChange={(e)=>setRestoring(e.target.checked)} />
                Restore mode
              </label>
              <label className="tb-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                Brush&nbsp;
                <input
                  type="range" min="8" max="80" value={brushSize}
                  onChange={(e)=>setBrushSize(parseInt(e.target.value||"26",10))}
                />
              </label>
              <button className="tb-btn" onClick={undo}>Undo</button>
              <button className="tb-btn danger" onClick={onClose}>Close</button>
            </div>
          </div>

          <div className="editor-area" style={{ marginTop: 12 }}>
            <canvas
              ref={cvsRef}
              onPointerDown={onDown}
              style={{ display: "block", maxWidth: "100%", cursor: "crosshair" }}
            />
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="tb-btn primary" onClick={applyAndContinue}>Apply & Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
}
