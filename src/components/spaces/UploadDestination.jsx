// src/components/spaces/UploadDestination.jsx
import React from "react";

export default function UploadDestination({
  cats = [],
  folders = [],
  catId = "",
  setCatId = () => {},
  folderId = "",
  setFolderId = () => {},
  addCategory,
  addFolder,
}) {
  return (
    <>
      <div className="muted" style={{ fontSize: 12, margin: "6px 0" }}>
        Step 2 — Pick where it goes (optional)
      </div>

      <label className="input" style={{ marginBottom: 8 }}>
        <div className="input__label">Category</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="select"
            value={catId}
            onChange={(e) => {
              setCatId(e.target.value);
              setFolderId("");
            }}
            style={{ flex: 1 }}
          >
            <option value="">— none —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || c.id}
              </option>
            ))}
          </select>
          <button
            className="btn sm"
            type="button"
            onClick={async () => {
              const t = prompt("New category name?");
              if (t && addCategory) await addCategory(t.trim());
            }}
          >
            New
          </button>
        </div>
      </label>

      <label className="input" style={{ marginBottom: 8 }}>
        <div className="input__label">Subfolder</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="select"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            style={{ flex: 1 }}
            disabled={!catId}
          >
            <option value="">— none —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title || f.id}
              </option>
            ))}
          </select>
          <button
            className="btn sm"
            type="button"
            disabled={!catId}
            onClick={async () => {
              if (!catId) return;
              const t = prompt("New subfolder name?");
              if (t && addFolder) await addFolder(catId, t.trim());
            }}
          >
            New
          </button>
        </div>
      </label>
    </>
  );
}
