// src/pages/admin/ChatManager.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "@/utils/init-firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";

export default function ChatManager() {
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("style talk");

  useEffect(() => {
    const q = query(collection(db, "threads"), orderBy("lastActivityAt","desc"), limit(maxThreads));
    const off = onSnapshot(q, (snap) => setRows(snap.docs.map(d=>({id:d.id, ...d.data()}))));
    return off;
  }, []);

  async function createThread(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await addDoc(collection(db,"forum/threads"), {
      title: title.trim(),
      tag,
      excerpt: "New topic 👀",
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      replyCount: 0,
      locked: false,
      createdBy: auth.currentUser?.uid || null
    });
    setTitle("");
  }
  async function toggleLock(r) {
    await updateDoc(doc(db,"forum/threads", r.id), {
      locked: !r.locked, updatedAt: serverTimestamp()
    });
  }
  async function feature(r) {
    await updateDoc(doc(db,"forum/threads", r.id), {
      featured: true, featuredAt: serverTimestamp()
    });
  }
  async function remove(r) {
    if (!confirm("Delete this thread?")) return;
    await deleteDoc(doc(db,"forum/threads", r.id));
  }

  return (
    <section className="container" style={{padding:16}}>
      <div className="dashboard-card">
        <div className="card__body">
          <h2 className="card__title">Bestie Chat — Admin</h2>

          <form onSubmit={createThread} className="row" style={{display:"flex", gap:8, marginBottom:12}}>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="New thread title…" />
            <select value={tag} onChange={(e)=>setTag(e.target.value)}>
              <option>style talk</option>
              <option>shopping finds</option>
              <option>events</option>
              <option>help me style</option>
            </select>
            <button className="tb-btn primary" type="submit">Create</button>
          </form>

          <div className="dashboard-grid" style={{gridTemplateColumns:"1fr"}}>
            {rows.map(r => (
              <div className="dashboard-card" key={r.id} style={{display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:10}}>
                <div>
                  <div style={{fontWeight:700}}>{r.title}</div>
                  <div className="muted sm">{r.tag} • {r.replyCount||0} replies {r.locked ? "• locked" : ""}</div>
                </div>
                <div className="row" style={{display:"inline-flex", gap:6}}>
                  <button className="tb-btn" onClick={()=>toggleLock(r)}>{r.locked?"Unlock":"Lock"}</button>
                  <button className="tb-btn" onClick={()=>feature(r)}>Feature</button>
                  <button className="tb-btn danger" onClick={()=>remove(r)}>Delete</button>
                </div>
              </div>
            ))}
            {rows.length === 0 && <div className="empty">No threads yet.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
