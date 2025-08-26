// src/pages/ForumThreadPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { auth, db } from "@/utils/init-firebase";
import {
  doc, getDoc, onSnapshot, collection, addDoc, orderBy, query, serverTimestamp
} from "firebase/firestore";

export default function ForumThreadPage() {
  const { id } = useParams();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!id) return;
    const tRef = doc(db, "forum/threads", id);
    getDoc(tRef).then(s => s.exists() && setThread({ id: s.id, ...s.data() }));
    const pRef = collection(db, "forum/threads", id, "posts");
    const off = onSnapshot(query(pRef, orderBy("createdAt", "asc")), (snap) =>
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => off();
  }, [id]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, "forum/threads", id, "posts"), {
      uid: auth.currentUser?.uid || null,
      displayName: auth.currentUser?.displayName || "Bestie",
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  }

  if (!thread) return <section className="container" style={{ padding:16 }}><div className="dashboard-card">Loading…</div></section>;

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ padding: 16 }}>
        <Link to="/community/forum" className="muted">← Back to forum</Link>
        <h1 style={{ marginTop: 8 }}>{thread.title}</h1>
        {thread.excerpt ? <p className="muted">{thread.excerpt}</p> : null}

        <div style={{ marginTop: 12, display:"grid", gap: 8 }}>
          {posts.map(p => (
            <article key={p.id} className="dashboard-card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{p.displayName || "Bestie"}</div>
              <p style={{ margin: "6px 0 0" }}>{p.text}</p>
            </article>
          ))}
          {posts.length === 0 && <p className="muted">No replies yet — be the first!</p>}
        </div>

        <form onSubmit={send} style={{ display:"grid", gap:8, marginTop: 12 }}>
          <textarea rows={3} placeholder="Add your thoughts…" value={text} onChange={e=>setText(e.target.value)} />
          <button className="btn primary" type="submit">Post reply</button>
        </form>
      </div>
    </section>
  );
}
