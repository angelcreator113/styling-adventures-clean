// src/pages/creator/spaces/SpaceFilters.jsx
import React from "react";

export default function SpaceFilters({
  cats, catId, setCatId,
  folders, folderId, setFolderId,
  addCategory, addFolder,
  count,
}) {
  return (
    <div className="dashboard-card" style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
      <label className="input" style={{ minWidth: 280 }}>
        <div className="input__label">Category</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="select"
            value={catId}
            onChange={(e) => { setCatId(e.target.value); setFolderId(""); }}
            style={{ flex: 1 }}
          >
            <option value="">— all —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.title || c.id}</option>
            ))}
          </select>
          <button type="button" className="btn sm" onClick={addCategory}>New</button>
        </div>
      </label>

      <label className="input" style={{ minWidth: 280 }}>
        <div className="input__label">Subfolder</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="select"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            style={{ flex: 1 }}
            disabled={!catId}
          >
            <option value="">— all —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.title || f.id}</option>
            ))}
          </select>
          <button type="button" className="btn sm" onClick={addFolder} disabled={!catId}>New</button>
        </div>
      </label>

      <div className="muted" style={{ marginLeft: "auto" }}>{count} item{count === 1 ? "" : "s"}</div>
    </div>
  );
}
