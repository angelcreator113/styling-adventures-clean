// src/components/spaces/UploadDropzone.jsx
import React, { useEffect, useRef } from "react";

export default function UploadDropzone({ busy = false, onFile }) {
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const over = (e) => { e.preventDefault(); el.classList.add("is-hover"); };
    const leave = () => el.classList.remove("is-hover");
    const drop = (e) => {
      e.preventDefault();
      el.classList.remove("is-hover");
      const f = e.dataTransfer.files?.[0];
      if (f && onFile) onFile(f);
    };
    el.addEventListener("dragover", over);
    el.addEventListener("dragleave", leave);
    el.addEventListener("drop", drop);
    return () => {
      el.removeEventListener("dragover", over);
      el.removeEventListener("dragleave", leave);
      el.removeEventListener("drop", drop);
    };
  }, [onFile]);

  function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f && onFile) onFile(f);
  }

  return (
    <div
      ref={dropRef}
      onClick={() => inputRef.current?.click()}
      style={{
        border: "2px dashed #e5d9ff",
        background: "#f8f5ff",
        height: 160,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        cursor: busy ? "not-allowed" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
      title={busy ? "Processing…" : "Click to choose a file"}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={pick}
        disabled={busy}
      />
      <div style={{ color: "#7c3aed", fontWeight: 600 }}>
        {busy ? "Processing…" : "Drag & drop or click to choose a file…"}
      </div>
    </div>
  );
}
