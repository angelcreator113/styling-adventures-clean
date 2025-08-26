// src/components/spaces/UploadPreview.jsx
import React from "react";

export default function UploadPreview({ previewUrl }) {
  return (
    <div className="dashboard-card" style={{ padding: 8, height: 160, borderRadius: 12 }}>
      {previewUrl ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 10,
            border: "1px solid #eee",
            background: `#fff url("${previewUrl}") center/contain no-repeat`,
          }}
          aria-label="Preview"
        />
      ) : (
        <div className="muted" style={{ fontSize: 13 }}>
          Pick a file to preview it here.
        </div>
      )}
    </div>
  );
}
