import React, { useEffect, useState } from "react";

// If/when you need Firebase:
// import { auth, db } from "@/utils/firebase-client";

function PanelsManager() {                       // <-- renamed to avoid any collisions
  const [panels, setPanels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("uploadPanels") || "[]");
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [accept, setAccept] = useState("");

  useEffect(() => {
    localStorage.setItem("uploadPanels", JSON.stringify(panels));
  }, [panels]);

  const onAdd = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/\s+/g, "-");
    if (panels.some(p => p.id === id)) return;   // prevent duplicates
    setPanels(prev => [...prev, { id, label: trimmed, accept }]);
    setName("");
    setAccept("");
  };

  const onDelete = (index) => {
    setPanels(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <section className="container">
      <h1 className="page-title">Manage Panels</h1>

      <form id="add-panel-form" onSubmit={onAdd} style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr auto" }}>
          <input
            id="panel-name"
            type="text"
            placeholder="Panel name (e.g., Photos)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Panel name"
          />
          <input
            id="file-type"
            type="text"
            placeholder='Accept (e.g., ".png,.jpg" or "image/*")'
            value={accept}
            onChange={(e) => setAccept(e.target.value)}
            aria-label="Accept file types"
          />
          <button type="submit" className="tb-btn primary" disabled={!name.trim()}>
            Add
          </button>
        </div>
      </form>

      <div id="panel-list">
        <h2 style={{ marginBottom: 10 }}>Existing Panels</h2>
        {panels.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No panels yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {panels.map((panel, index) => (
              <div key={panel.id} className="panel-item"
                   style={{ display:"flex", justifyContent:"space-between",
                            alignItems:"center", padding:"10px 12px",
                            border:"1px solid rgba(76,29,149,0.10)",
                            borderRadius:12, background:"var(--surface-muted)" }}>
                <span>
                  <strong>{panel.label}</strong> — <code>{panel.accept || "—"}</code>
                </span>
                <button type="button" onClick={() => onDelete(index)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PanelsManager;                     // <-- single default export
