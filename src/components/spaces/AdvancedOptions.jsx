// src/components/spaces/AdvancedOptions.jsx
import React from "react";

export default function AdvancedOptions({ uiPrefix = "files-" }) {
  return (
    <details className="advanced" style={{ marginTop: 8 }}>
      <summary style={{ cursor: "pointer", color: "#6b7280" }}>Advanced</summary>
      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        <label className="chk">
          <input id={`${uiPrefix}feat-compress`} type="checkbox" defaultChecked /> Smart compress
        </label>
        <label className="chk">
          <input id={`${uiPrefix}feat-trim`} type="checkbox" defaultChecked /> Remove background
        </label>
        <label className="chk">
          <input id={`${uiPrefix}feat-pad`} type="checkbox" defaultChecked /> Pad to square
        </label>
        <label className="chk">
          <input id={`${uiPrefix}feat-autoname`} type="checkbox" defaultChecked /> Auto-name file
        </label>
        <label className="chk">
          <input id={`${uiPrefix}feat-public`} type="checkbox" defaultChecked /> Make public
        </label>
      </div>
    </details>
  );
}
