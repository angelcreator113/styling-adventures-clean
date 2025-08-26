// src/components/BestieToolboxPanel.jsx
import React, { useEffect, useState } from "react";
import ManualEditor from "@/components/ManualEditor.jsx";
import BoardsPanel from "@/components/BoardsPanel.jsx";
import { auth, db } from "@/utils/init-firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";

const TABS = [
  { id: "appearance", label: "Appearance" },
  { id: "naming", label: "Naming" },
  { id: "cats", label: "Categories" },
  { id: "boards", label: "Boards" },
  { id: "advanced", label: "Advanced" },
];

export default function BestieToolboxPanel({ uiPrefix = "" }) {
  const [tab, setTab] = useState("appearance");
  const [manualOpen, setManualOpen] = useState(false);

  // per-user categories (quick labels)
  const [cats, setCats] = useState([]);
  const [newCat, setNewCat] = useState("");
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const qy = query(collection(db, `users/${u.uid}/categories`), orderBy("label", "asc"));
    const off = onSnapshot(qy, (snap) => setCats(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return off;
  }, []);

  async function addCategory() {
    const label = (newCat || "").trim();
    if (!label) return;
    await addDoc(collection(db, `users/${auth.currentUser.uid}/categories`), { label });
    setNewCat("");
  }
  async function removeCategory(id) {
    await deleteDoc(doc(db, `users/${auth.currentUser.uid}/categories/${id}`));
  }

  return (
    <div className="toolbox">
      <header className="toolbox__hd">
        <h2 className="card__title" style={{ margin: 0 }}>Bestie Toolbox</h2>
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="toolbox__body">
        {/* Appearance tab (clear labels) */}
        {tab === "appearance" && (
          <div className="tool-block">
            <div className="tool-row">
              <div className="tool-title">Brand look</div>
              <div className="tool-sub">We’ll make a cute preview + icons for your closet and boards.</div>

              <label className="tool-check">
                <span className="tool-title">Theme</span>
                <select id={`${uiPrefix}appearance-theme`} defaultValue="lavender" className="input" style={{ marginLeft: 8 }}>
                  <option value="lavender">Lavender</option>
                  <option value="sky">Sky</option>
                  <option value="cream">Ivory/Cream</option>
                </select>
              </label>

              <hr style={{ gridColumn: "1 / -1", opacity:.2 }} />

              <label className="tool-check">
                <input id={`${uiPrefix}export-preview`} type="checkbox" defaultChecked />
                <span className="tool-title">Make a pretty preview (1024)</span>
              </label>

              <label className="tool-check">
                <input id={`${uiPrefix}export-icon`} type="checkbox" defaultChecked />
                <span className="tool-title">Make a 500×500 icon</span>
              </label>

              <label className="tool-check">
                <input id={`${uiPrefix}export-icon-hover`} type="checkbox" defaultChecked />
                <span className="tool-title">Also make a hover icon</span>
              </label>

              <hr style={{ gridColumn: "1 / -1", opacity:.2 }} />

              <label className="tool-check">
                <input id={`${uiPrefix}feat-trim`} type="checkbox" defaultChecked />
                <span className="tool-title">Remove background</span>
              </label>

              <label className="tool-check">
                <input id={`${uiPrefix}feat-server`} type="checkbox" defaultChecked />
                <span className="tool-title">Use pro cutout (sharper edges)</span>
              </label>

              <div style={{ gridColumn: "1 / -1" }}>
                <button type="button" className="tb-btn" onClick={() => setManualOpen(true)}>
                  Manual Editor…
                </button>
                <div className="tool-sub">Brush erase/restore with undo, then “Apply & Continue”.</div>
              </div>
            </div>
          </div>
        )}

        {/* Naming tab */}
        {tab === "naming" && (
          <div className="tool-block">
            <div className="tool-row">
              <label className="tool-check">
                <input id={`${uiPrefix}feat-autoname`} type="checkbox" defaultChecked />
                <span className="tool-title">Auto name my upload</span>
              </label>
              <div className="tool-sub">We’ll read the file & category to suggest a cute title.</div>
            </div>
          </div>
        )}

        {/* Categories tab */}
        {tab === "cats" && (
          <div className="tool-block">
            <div className="tool-row">
              <div className="tool-title">My category names</div>
              <div className="tool-sub">Rename or add your own. These show up in the upload form.</div>

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <input
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="e.g. My Sparkles"
                  className="input"
                  style={{ flex: 1 }}
                />
                <button className="tb-btn" type="button" onClick={addCategory}>Add</button>
              </div>

              <ul style={{ gridColumn: "1 / -1", margin: "8px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {cats.map(c => (
                  <li key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 10 }}>
                    <span>{c.label}</span>
                    <button className="tb-btn danger" onClick={() => removeCategory(c.id)}>Delete</button>
                  </li>
                ))}
                {!cats.length && <li className="muted">No custom categories yet.</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Boards tab */}
        {tab === "boards" && <BoardsPanel />}

        {/* Advanced tab */}
        {tab === "advanced" && (
          <div className="tool-block">
            <div className="tool-row">
              <label className="tool-check">
                <input id={`${uiPrefix}feat-compress`} type="checkbox" defaultChecked />
                <span className="tool-title">Smart compress</span>
              </label>
              <div className="tool-sub">Faster uploads, same quality.</div>

              <label className="tool-check">
                <input id={`${uiPrefix}feat-pad`} type="checkbox" defaultChecked />
                <span className="tool-title">Pad to square</span>
              </label>

              <label className="tool-check">
                <input id={`${uiPrefix}feat-public`} type="checkbox" defaultChecked />
                <span className="tool-title">Make Public</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {manualOpen && <ManualEditor uiPrefix={uiPrefix} onClose={() => setManualOpen(false)} />}
    </div>
  );
}
