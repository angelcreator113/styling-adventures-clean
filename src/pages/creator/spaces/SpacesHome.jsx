// src/pages/creator/SpacesHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/utils/init-firebase";
import {
  addDoc, collection, onSnapshot, orderBy, query, serverTimestamp
} from "firebase/firestore";
import { useUserRole } from "@/hooks/useUserRole";

function SpaceCreateModal({ open, onClose, onCreate, remaining }) {
  const [name, setName] = useState("");
  useEffect(() => { if (!open) setName(""); }, [open]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="modal-backdrop">
      <div className="modal card">
        <h3 style={{marginTop:0}}>Create a Space</h3>
        <p className="muted" style={{marginTop:4}}>You can rename it later.</p>
        <label className="input" style={{marginTop:12}}>
          <div className="input__label">Space name</div>
          <input
            className="input__field"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Morning TikToks"
            autoFocus
          />
        </label>
        <div className="muted" style={{marginTop:8}}>
          {remaining > 999 ? "Unlimited spaces" : `${remaining} left in your plan`}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={!name.trim()}
            onClick={() => onCreate(name.trim())}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpacesHome() {
  const uid = auth.currentUser?.uid;
  const nav = useNavigate();
  const { role } = useUserRole(); // 'creator' | 'admin' | 'fan'
  const maxSpaces = role === "admin" ? 1000 : role === "creator" ? 2 : 0;

  const [spaces, setSpaces] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const qq = query(collection(db, `users/${uid}/spaces`), orderBy("createdAt", "asc"));
    return onSnapshot(qq, snap => {
      setSpaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  const remaining = useMemo(() => Math.max(0, maxSpaces - spaces.length), [maxSpaces, spaces.length]);

  async function createSpace(name) {
    if (!uid) return;
    if (remaining <= 0) return alert("You’ve reached your space limit.");
    const ref = await addDoc(collection(db, `users/${uid}/spaces`), {
      name, createdAt: serverTimestamp()
    });
    setOpen(false);
    nav(`/creator/spaces/${ref.id}`);
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="top-row" style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <h1 className="page-title" style={{margin:0,flex:1}}>Spaces</h1>
        <button className="btn primary" onClick={() => setOpen(true)} disabled={remaining <= 0}>
          + New Space
        </button>
        <span className="muted">{remaining > 999 ? "Unlimited" : `${remaining} left`}</span>
      </div>

      <div className="grid" style={{display:"grid",gap:12,gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}}>
        {spaces.map(s => (
          <Link key={s.id} to={`/creator/spaces/${s.id}`} className="dashboard-card" style={{padding:14, textDecoration:"none"}}>
            <div className="badge" aria-hidden>SPACE</div>
            <h3 style={{margin:"8px 0 4px"}}>{s.name || "Untitled Space"}</h3>
            <p className="muted" style={{margin:0}}>Open to upload & manage files</p>
          </Link>
        ))}
        {!spaces.length && (
          <div className="dashboard-card" style={{padding:16}}>
            <p style={{margin:0}}>No spaces yet.</p>
            <button className="btn" style={{marginTop:8}} onClick={() => setOpen(true)} disabled={remaining <= 0}>
              Create your first Space
            </button>
          </div>
        )}
      </div>

      <SpaceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createSpace}
        remaining={remaining > 999 ? 1000 : remaining}
      />
    </section>
  );
}
