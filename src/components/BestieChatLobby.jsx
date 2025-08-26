// src/components/BestieChatLobby.jsx
// Compact lobby teaser with admin tools visible for admins.
// Uses top-level "threads" collection.

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/utils/init-firebase";
import {
  collection, doc, onSnapshot, orderBy, query, limit,
  setDoc, deleteDoc, updateDoc, serverTimestamp
} from "firebase/firestore";

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    return auth.onIdTokenChanged(async (u) => {
      try {
        const t = await u?.getIdTokenResult();
        setIsAdmin(!!(t?.claims?.admin || t?.claims?.role === "admin"));
      } catch { setIsAdmin(false); }
    });
  }, []);
  return isAdmin;
}

const fmt = (n) => new Intl.NumberFormat().format(n || 0);

export default function BestieChatLobby({ maxThreads = 3 }) {
  const nav = useNavigate();
  const isAdmin = useIsAdmin();
  const [threads, setThreads] = useState([]);
  const [reactions, setReactions] = useState({}); // { [threadId]: {heart,fire,star,mine:{}} }

  // latest threads
  useEffect(() => {
    const q = query(collection(db, "threads"), orderBy("lastActivityAt", "desc"), limit(maxThreads));
    const off = onSnapshot(q, (snap) => setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return off;
  }, [maxThreads]);

  // live reaction counts per thread
  useEffect(() => {
    const offs = threads.map(t =>
      onSnapshot(collection(db, `threads/${t.id}/reactions`), (snap) => {
        const counts = { heart:0, fire:0, star:0, mine:{} };
        snap.forEach(d => {
          const r = d.data();
          if (r.type === "heart") counts.heart++;
          if (r.type === "fire")  counts.fire++;
          if (r.type === "star")  counts.star++;
          if (auth.currentUser && d.id.startsWith(auth.currentUser.uid + "_")) counts.mine[r.type] = true;
        });
        setReactions(m => ({ ...m, [t.id]: counts }));
      })
    );
    return () => offs.forEach(fn => fn && fn());
  }, [threads.map(t => t.id).join("|")]);

  async function toggleReact(threadId, type) {
    const u = auth.currentUser; if (!u) return nav("/login");
    const rid = `${u.uid}_${type}`;
    const ref = doc(db, `threads/${threadId}/reactions/${rid}`);
    const mine = reactions[threadId]?.mine?.[type];
    try {
      mine ? await deleteDoc(ref)
           : await setDoc(ref, { type, uid: u.uid, createdAt: serverTimestamp() });
    } catch(e){ console.warn(e); }
  }

  // Admin tools
  async function lockToggle(t) {
    try { await updateDoc(doc(db, "threads", t.id), { locked: !t.locked, updatedAt: serverTimestamp() }); }
    catch(e){ console.warn(e); }
  }
  async function feature(t) {
    try { await updateDoc(doc(db, "threads", t.id), { featured: true, featuredAt: serverTimestamp() }); }
    catch(e){ console.warn(e); }
  }
  async function remove(t) {
    if (!confirm("Delete this thread?")) return;
    try { await deleteDoc(doc(db, "threads", t.id)); }
    catch(e){ console.warn(e); }
  }

  return (
    <div className="chat-lobby">
      <div className="chat-lobby__bg" aria-hidden />
      <div className="chat-lobby__grid">
        {threads.map((t) => {
          const reacts = reactions[t.id] || { heart:0, fire:0, star:0, mine:{} };
          return (
            <article key={t.id} className="thread-card">
              <header className="thread-card__hd">
                <div className="stack"><div className="av"><span>💬</span></div></div>
                <div className="thread-meta">
                  <h3 className="thread-title">{t.title || "Thread"}</h3>
                  <div className="muted sm">
                    {fmt(t.replyCount)} replies • {t.locked ? "locked" : "open"}
                  </div>
                </div>
              </header>

              <p className="thread-snippet">
                {t.excerpt || "Y’all are serving LEWKS — jump in and add your spice! ✨"}
              </p>

              <div className="thread-actions">
                <div className="reacts">
                  <button className={`react ${reacts.mine.heart?"is-on":""}`} onClick={()=>toggleReact(t.id,"heart")}>❤️ <span>{fmt(reacts.heart)}</span></button>
                  <button className={`react ${reacts.mine.fire ?"is-on":""}`}  onClick={()=>toggleReact(t.id,"fire")}>🔥 <span>{fmt(reacts.fire)}</span></button>
                  <button className={`react ${reacts.mine.star ?"is-on":""}`}  onClick={()=>toggleReact(t.id,"star")}>✨ <span>{fmt(reacts.star)}</span></button>
                </div>

                <div className="row" style={{display:"inline-flex", gap:8}}>
                  <Link to={`/community/forum/${t.id}`} className="btn sm primary">Join thread</Link>
                  {isAdmin && (
                    <>
                      <button className="btn sm" onClick={()=>lockToggle(t)}>{t.locked ? "Unlock" : "Lock"}</button>
                      <button className="btn sm" onClick={()=>feature(t)}>Feature</button>
                      <button className="btn sm danger" onClick={()=>remove(t)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
