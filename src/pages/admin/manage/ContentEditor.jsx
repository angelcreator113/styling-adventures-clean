// src/pages/admin/ContentEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { db, storage, auth } from "@/utils/init-firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function useCol(path, orderByField = null, dir = "asc") {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const base = orderByField ? query(collection(db, path), orderBy(orderByField, dir)) : collection(db, path);
    const off = onSnapshot(base, (snap) => setRows(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => off();
  }, [path, orderByField, dir]);
  return rows;
}

async function uploadPublicImage(file) {
  const key = `images/public/${Date.now()}-${file.name}`;
  const r = ref(storage, key);
  await uploadBytes(r, file, { contentType: file.type });
  return await getDownloadURL(r);
}

export default function ContentEditor() {
  const uid = auth.currentUser?.uid;

  const topPicks   = useCol("public/top_picks/items", "rank", "asc");
  const spotlights = useCol("public/spotlights", "featuredAt", "desc");
  const threads    = useCol("forum/threads", "lastActivityAt", "desc");

  // forms
  const [tp, setTp] = useState({ title: "", note: "", rank: 1, imageUrl: "" });
  const [sp, setSp] = useState({ userName: "", quote: "", imageUrl: "" });
  const [th, setTh] = useState({ title: "", excerpt: "" });

  async function addTopPick(e) {
    e.preventDefault();
    const inputFile = e.target.elements.tpfile.files?.[0];
    const imageUrl = inputFile ? await uploadPublicImage(inputFile) : tp.imageUrl || "";
    await addDoc(collection(db, "public/top_picks/items"), {
      ...tp, rank: Number(tp.rank) || 1, imageUrl, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    setTp({ title: "", note: "", rank: 1, imageUrl: "" });
    e.target.reset();
  }
  async function addSpotlight(e) {
    e.preventDefault();
    const inputFile = e.target.elements.spfile.files?.[0];
    const imageUrl = inputFile ? await uploadPublicImage(inputFile) : sp.imageUrl || "";
    await addDoc(collection(db, "public/spotlights"), {
      ...sp, imageUrl, featuredAt: serverTimestamp(), createdBy: uid || null
    });
    setSp({ userName: "", quote: "", imageUrl: "" });
    e.target.reset();
  }
  async function addThread(e) {
    e.preventDefault();
    await addDoc(collection(db, "forum/threads"), {
      ...th, replyCount: 0, createdAt: serverTimestamp(), lastActivityAt: serverTimestamp()
    });
    setTh({ title: "", excerpt: "" });
  }

  const deleteDocAt = (path, id) => deleteDoc(doc(db, path, id));
  const bumpRank = (d, delta) =>
    updateDoc(doc(db, "public/top_picks/items", d.id), { rank: Math.max(1, (Number(d.rank) || 1) + delta) });

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Content Editor</h1>
        <p>Admin tools to manage public content on the Home page.</p>

        {/* TOP PICKS */}
        <h2>Top Picks</h2>
        <form onSubmit={addTopPick} className="grid" style={{ gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))" }}>
          <input  placeholder="Title" value={tp.title} onChange={e => setTp({ ...tp, title: e.target.value })} required />
          <input  placeholder="Note"  value={tp.note}  onChange={e => setTp({ ...tp, note: e.target.value })} />
          <input  placeholder="Rank"  type="number" min="1" value={tp.rank} onChange={e => setTp({ ...tp, rank: e.target.value })} />
          <input  placeholder="Image URL (optional)" value={tp.imageUrl} onChange={e => setTp({ ...tp, imageUrl: e.target.value })} />
          <input  name="tpfile" type="file" accept="image/*" />
          <button className="btn primary" type="submit">Add Top Pick</button>
        </form>

        <div className="cards" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", marginTop: 12 }}>
          {topPicks.map(p => (
            <article key={p.id} className="dashboard-card" style={{ padding: 8 }}>
              <div style={{ aspectRatio: "3/4", background: "#fafafa", border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <strong>{p.title}</strong><code>#{p.rank}</code>
              </div>
              <div className="row" style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button className="btn sm" onClick={() => bumpRank(p, -1)}>↑</button>
                <button className="btn sm" onClick={() => bumpRank(p, +1)}>↓</button>
                <button className="btn sm danger" onClick={() => deleteDocAt("public/top_picks/items", p.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>

        <hr style={{ margin: "20px 0" }} />

        {/* SPOTLIGHTS */}
        <h2>Fan Spotlights</h2>
        <form onSubmit={addSpotlight} className="grid" style={{ gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))" }}>
          <input  placeholder="Username" value={sp.userName} onChange={e => setSp({ ...sp, userName: e.target.value })} required />
          <input  placeholder="Quote"    value={sp.quote}    onChange={e => setSp({ ...sp, quote: e.target.value })} />
          <input  placeholder="Image URL (optional)" value={sp.imageUrl} onChange={e => setSp({ ...sp, imageUrl: e.target.value })} />
          <input  name="spfile" type="file" accept="image/*" />
          <button className="btn primary" type="submit">Add Spotlight</button>
        </form>

        <div className="cards" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", marginTop: 12 }}>
          {spotlights.map(s => (
            <article key={s.id} className="dashboard-card" style={{ padding: 8 }}>
              <div style={{ aspectRatio: "16/10", background: "#fafafa", border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                {s.imageUrl ? <img src={s.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
              <div style={{ marginTop: 6 }}><strong>{s.userName}</strong></div>
              <div style={{ fontStyle: "italic", color: "#6b7280" }}>{s.quote}</div>
              <button className="btn sm danger" style={{ marginTop: 6 }} onClick={() => deleteDocAt("public/spotlights", s.id)}>Delete</button>
            </article>
          ))}
        </div>

        <hr style={{ margin: "20px 0" }} />

        {/* FORUM THREADS */}
        <h2>Forum Threads</h2>
        <form onSubmit={addThread} className="grid" style={{ gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))" }}>
          <input placeholder="Title" value={th.title} onChange={e => setTh({ ...th, title: e.target.value })} required />
          <input placeholder="Excerpt" value={th.excerpt} onChange={e => setTh({ ...th, excerpt: e.target.value })} />
          <button className="btn primary" type="submit">Create Thread</button>
        </form>

        <ul style={{ marginTop: 12, paddingLeft: 16 }}>
          {threads.map(t => (
            <li key={t.id} style={{ marginBottom: 8 }}>
              <strong>{t.title}</strong> — <span style={{ color: "#6b7280" }}>{t.excerpt}</span>
              <button className="btn sm danger" style={{ marginLeft: 8 }} onClick={() => deleteDocAt("forum/threads", t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
