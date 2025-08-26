// src/components/ChatLobby.jsx
// Full-page lobby using top-level `threads/*` as per your rules.
// Fans: browse + react + join a thread
// Admin: can also create/pin/close/delete from this page

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/utils/init-firebase";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, limit as fbLimit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "@/css/components/chat-lobby.css";

function useRole() {
  const [role, setRole] = useState(null);
  useEffect(() => {
    const apply = async (u) => {
      if (!u) return setRole(null);
      const tok = await u.getIdTokenResult();
      setRole(tok.claims?.admin ? "admin" : (tok.claims?.role || null));
    };
    apply(auth.currentUser);
    return onAuthStateChanged(auth, apply);
  }, []);
  return role;
}

const fmt = (n) => new Intl.NumberFormat().format(n || 0);

function NewThread({ onCreate, onCancel, pending }) {
  const [title, setTitle] = useState("");
  const [tags, setTags]   = useState("");
  return (
    <div className="lobby-new">
      <input
        className="lobby-input"
        placeholder="Thread title…"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        maxLength={120}
      />
      <input
        className="lobby-input"
        placeholder="Tags (comma)… e.g. style-help, event-fits"
        value={tags}
        onChange={(e)=>setTags(e.target.value)}
      />
      <div className="lobby-actions">
        <button className="btn ghost" onClick={onCancel} disabled={pending}>Cancel</button>
        <button
          className="btn primary"
          disabled={pending || !title.trim()}
          onClick={()=>onCreate({ title, tags })}
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}

export default function ChatLobby({ pageSize = 100 }) {
  const role = useRole();
  const isAdmin = role === "admin";
  const nav = useNavigate();

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [queryText, setQueryText] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [pendingNew, setPendingNew] = useState(false);
  const searchRef = useRef();

  // reactions cache: { [id]: {heart,fire,star,mine:{heart,fire,star}} }
  const [reacts, setReacts] = useState({});

  // Load threads
  useEffect(() => {
    const q = query(collection(db, "threads"), orderBy("lastActivityAt", "desc"), fbLimit(pageSize));
    const off = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Bring pinned to the top without a composite index:
      rows.sort((a,b) => {
        const ap = a.pinned ? 1 : 0, bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        const at = a.lastActivityAt?.seconds || 0, bt = b.lastActivityAt?.seconds || 0;
        return bt - at;
      });
      setThreads(rows);
      setLoading(false);
    });
    return off;
  }, [pageSize]);

  // Live reactions watchers per thread
  useEffect(() => {
    const offs = threads.map(t =>
      onSnapshot(collection(db, `threads/${t.id}/reactions`), (snap) => {
        const c = { heart:0, fire:0, star:0, mine:{} };
        snap.forEach(d => {
          const r = d.data();
          if (r.type === "heart") c.heart++;
          if (r.type === "fire")  c.fire++;
          if (r.type === "star")  c.star++;
          if (auth.currentUser && d.id.startsWith(auth.currentUser.uid + "_")) c.mine[r.type] = true;
        });
        setReacts(m => ({ ...m, [t.id]: c }));
      })
    );
    return () => offs.forEach(fn => fn && fn());
  }, [threads.map(t => t.id).join("|")]);

  const tagCloud = useMemo(() => {
    const counts = new Map();
    threads.forEach(t => (t.tags || []).forEach(x => counts.set(x, (counts.get(x)||0)+1)));
    return Array.from(counts.entries())
      .sort((a,b)=>b[1]-a[1])
      .slice(0, 8)
      .map(([name,count]) => ({ name, count }));
  }, [threads]);

  const shown = useMemo(() => {
    let rows = threads;
    const s = queryText.trim().toLowerCase();
    if (activeTag) rows = rows.filter(r => (r.tags||[]).includes(activeTag));
    if (s) rows = rows.filter(r => (`${r.title} ${(r.tags||[]).join(" ")}`.toLowerCase().includes(s)));
    return rows;
  }, [threads, queryText, activeTag]);

  async function toggleReact(id, type) {
    const u = auth.currentUser; if (!u) return nav("/login");
    const mine = reacts[id]?.mine?.[type];
    const ref = doc(db, `threads/${id}/reactions/${u.uid}_${type}`);
    try {
      if (mine) {
        await deleteDoc(ref);
      } else {
        await addDoc(collection(db, `threads/${id}/reactions`), {}); // noop to warm rules (optional)
        await updateDoc(ref, {}); // if exists, else fall through
      }
    } catch { /* ignore */ }
    try {
      // use set to create/overwrite; rules allow create/delete only
      mine
        ? await deleteDoc(ref)
        : await (await import("firebase/firestore")).setDoc(ref, { type, uid: u.uid, createdAt: serverTimestamp() });
    } catch (e) { console.warn(e); }
  }

  // Admin: create / pin / close / delete
  async function createThread({ title, tags }) {
    if (!isAdmin) return;
    setPendingNew(true);
    try {
      const now = serverTimestamp();
      const tagList = tags
        .split(",")
        .map(x => x.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6);
      await addDoc(collection(db, "threads"), {
        title: title.trim(),
        tags: tagList,
        excerpt: "New topic 👀",
        pinned: false,
        locked: false,
        replyCount: 0,
        likeCount: 0,
        createdAt: now,
        lastActivityAt: now,
        createdBy: {
          uid: auth.currentUser?.uid || null,
          name: auth.currentUser?.displayName || "Lala",
        }
      });
      setOpenNew(false);
      setQueryText("");
    } catch (e) {
      console.warn("create thread failed", e);
      alert("Could not create thread.");
    } finally {
      setPendingNew(false);
    }
  }

  async function adminToggle(id, field) {
    if (!isAdmin) return;
    try {
      const row = threads.find(t => t.id === id);
      await updateDoc(doc(db, "threads", id), {
        [field]: !row?.[field],
        updatedAt: serverTimestamp()
      });
    } catch (e) { console.warn("update failed", e); }
  }

  async function adminDelete(id) {
    if (!isAdmin || !confirm("Delete this thread and its messages?")) return;
    try { await deleteDoc(doc(db, "threads", id)); }
    catch (e) { console.warn("delete failed", e); }
  }

  return (
    <section className="chat-lobby">
      <div className="chat-lobby__bg" aria-hidden />

      <header className="lobby-hd">
        <div className="lobby-tags">
          <button
            className={`tag ${!activeTag ? "is-on":""}`}
            onClick={()=>setActiveTag("")}
            type="button"
          >
            #all
          </button>
          {tagCloud.map(t => (
            <button
              key={t.name}
              className={`tag ${activeTag===t.name ? "is-on":""}`}
              onClick={()=>setActiveTag(p=>p===t.name?"":t.name)}
              type="button"
              title={`${t.count} threads`}
            >
              #{t.name}
            </button>
          ))}
        </div>

        <div className="lobby-tools">
          <input
            ref={searchRef}
            className="lobby-search"
            placeholder="Search threads…"
            value={queryText}
            onChange={(e)=>setQueryText(e.target.value)}
          />
          {isAdmin && (
            <button className="btn" onClick={()=>setOpenNew(v=>!v)}>
              {openNew ? "Close Form" : "New Thread"}
            </button>
          )}
        </div>
      </header>

      {isAdmin && openNew && (
        <NewThread
          pending={pendingNew}
          onCreate={createThread}
          onCancel={()=>setOpenNew(false)}
        />
      )}

      <div className="lobby-grid">
        {loading && (
          <div className="lobby-empty">Loading…</div>
        )}

        {!loading && shown.map(row => {
          const r = reacts[row.id] || { heart:0, fire:0, star:0, mine:{} };
          return (
            <article
              key={row.id}
              className={`thread-card ${row.pinned ? "is-pinned" : ""} ${row.locked ? "is-closed" : ""}`}
            >
              {/* playful user pill */}
              <div className="user-pill" title={row.createdBy?.name || "Bestie"}>
                <span className="u-ava" aria-hidden>
                  {(row.createdBy?.name || "B")[0].toUpperCase()}
                </span>
                <span className="u-name">@{(row.createdBy?.name || "bestie").toLowerCase()}</span>
              </div>

              <h3 className="thread-title">
                {row.title}
                {row.locked && <span className="badgetxt">CLOSED</span>}
                {row.pinned && <span className="badgetxt gold">PINNED</span>}
              </h3>

              {row.tags?.length ? (
                <div className="tag-row">
                  {row.tags.map(t => <span key={t} className="tag sm">#{t}</span>)}
                </div>
              ) : null}

              <p className="thread-excerpt">{row.excerpt || "Let’s chat fits, links, inspo."}</p>

              <div className="thread-meta">
                <div className="reacts">
                  <button
                    className={`react ${r.mine?.heart ? "is-on":""}`}
                    title="Love"
                    onClick={()=>toggleReact(row.id, "heart")}
                  >💖 <span>{fmt(r.heart)}</span></button>
                  <button
                    className={`react ${r.mine?.star ? "is-on":""}`}
                    title="Sparkle"
                    onClick={()=>toggleReact(row.id, "star")}
                  >✨ <span>{fmt(r.star)}</span></button>
                  <button
                    className={`react ${r.mine?.fire ? "is-on":""}`}
                    title="Slay"
                    onClick={()=>toggleReact(row.id, "fire")}
                  >🔥 <span>{fmt(r.fire)}</span></button>
                </div>

                <div className="counts">
                  <span>{fmt(row.replyCount)} replies</span>
                  <span>·</span>
                  <span>{fmt(row.likeCount)} likes</span>
                </div>
              </div>

              <div className="thread-actions">
                <Link to={`/community/forum/${row.id}`} className="btn sm primary">Join thread</Link>
                {isAdmin && (
                  <div className="admin-tools">
                    <button className="btn xs" onClick={()=>adminToggle(row.id, "pinned")}>
                      {row.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button className="btn xs" onClick={()=>adminToggle(row.id, "locked")}>
                      {row.locked ? "Reopen" : "Close"}
                    </button>
                    <button className="btn xs danger" onClick={()=>adminDelete(row.id)}>Delete</button>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {!loading && shown.length === 0 && (
          <div className="lobby-empty">
            No threads yet {isAdmin ? "— start one ✨" : "— check back soon ✨"}
          </div>
        )}
      </div>
    </section>
  );
}
