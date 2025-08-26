// src/components/spaces/UploadFilePill.jsx
import React from "react";

export default function UploadFilePill({ fileName, pct = 0, ready = false, busy = false, onClear }) {
  if (!fileName) return null;
  return (
    <div
      className="dashboard-card"
      style={{ padding: 8, display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
    >
      <div
        style={{ width: 28, height: 28, borderRadius: 8, background: "#eee", display: "grid", placeItems: "center", fontSize: 12 }}
        title="Selected file"
      >
        📄
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontSize: 13, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
          title={fileName}
        >
          {fileName}
        </div>

        <div style={{ marginTop: 6 }}>
          <div style={{ height: 6, background: "#eee", borderRadius: 6 }}>
            <div
              style={{
                height: 6,
                width: `${pct || 0}%`,
                borderRadius: 6,
                background: pct > 0 ? "#7c3aed" : "#d1fae5",
                transition: "width 200ms linear",
              }}
            />
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {pct > 0 ? `${pct}% uploading…` : ready ? "✅ Ready to upload" : busy ? "Processing…" : ""}
          </div>
        </div>
      </div>

      <button className="btn sm" onClick={onClear} disabled={busy}>
        Clear
      </button>
    </div>
  );
}
