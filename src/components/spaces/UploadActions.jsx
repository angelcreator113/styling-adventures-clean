// src/components/spaces/UploadActions.jsx
import React from "react";

export default function UploadActions({ canUpload, onUpload }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button className="btn primary" onClick={onUpload} disabled={!canUpload}>
        Upload to Space
      </button>
      <button className="btn" disabled>
        Use Camera
      </button>
    </div>
  );
}
