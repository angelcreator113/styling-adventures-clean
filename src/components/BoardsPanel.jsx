// src/components/BoardsPanel.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { doc, onSnapshot, setDoc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { listenBoards, ensureDefaultBoards } from "@/utils/board-helpers";

export default function BoardsPanel() {
  const uid = auth.currentUser?.uid;
  const [autoByCat, setAutoByCat] = useState(true);
  const [boards, setBoards] = useState([]);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (!uid) return;
    ensureDefaultBoards(uid);
    const off1 = listenBoards(uid, setBoards);
    const off2 = onSnapshot(doc(db, `users/${uid}/settings/boards`), (snap) => {
      setAutoByCat(snap.exists() ? !!snap.data()?.autoByCategory : true);
    });
    return () => { off1?.(); off2?.(); };
  }, [uid]);

  async function saveAuto(v) {
    if (!uid) return;
    await setDoc(doc(db, `users/${uid}/settings/boards`), { autoByCategory: v }, { merge: true });
  }
  async function addBoard() {
    if (!uid) return;
    const label = newLabel.trim();
    if (!label) return;
    await addDoc(collection(db, `users/${uid}/boards`), { label, createdAt: new Date() });
    setNewLabel("");
  }
  async function removeBoard(id, locked) {
    if (!uid || locked) return;
    if (!window.confirm("Delete this board? Items will remain in Closet.")) return;
    await deleteDoc(doc(db, `users/${uid}/boards/${id}`));
  }

  return (
    <div className="tool-block">
      <div className="tool-row" style={{ alignItems: "center" }}>
        <div className="tool-title">Boards</div>
        <div className="tool-sub">Organize looks like Pinterest. Auto-create boards from categories if you like.</div>

        <label className="tool-check" style={{ gridColumn: "1 / -1" }}>
          <input
            type="checkbox"
            checked={autoByCat}
            onChange={(e) => { setAutoByCat(e.target.checked); saveAuto(e.target.checked); }}
          />
          <span className="tool-title">Auto-add new uploads to a board by category</span>
        </label>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="New board name (e.g., ‘Vacation Fits’)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="tb-btn" onClick={addBoard}>Create</button>
        </div>

        <ul style={{ gridColumn: "1 / -1", listStyle: "none", padding: 0, margin: "8px 0", display: "grid", gap: 8 }}>
          {boards.map(b => (
            <li key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {b.coverUrl ? <img src={b.coverUrl} alt="" width={36} height={36} style={{ borderRadius: 8, objectFit: "cover" }}/> : <div style={{ width:36, height:36, borderRadius:8, background:"#f4f4f8" }}/>}
                <div>
                  <div style={{ fontWeight: 600 }}>{b.label || b.key}</div>
                  {b.locked && <div className="muted" style={{ fontSize: 12 }}>Locked default</div>}
                </div>
              </div>
              <div>
                {!b.locked && <button className="tb-btn danger" onClick={() => removeBoard(b.id, b.locked)}>Delete</button>}
              </div>
            </li>
          ))}
          {!boards.length && <li className="muted">No boards yet.</li>}
        </ul>
      </div>
    </div>
  );
}
