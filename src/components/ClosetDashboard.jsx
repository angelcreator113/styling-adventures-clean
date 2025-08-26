import React, { useEffect, useMemo, useRef, useState } from "react";
import { auth, db, storage } from "@/utils/init-firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ref, getDownloadURL, deleteObject } from "firebase/storage";
import { listenBoards, addItemToBoard } from "@/utils/board-helpers";
import { useUserRole } from "@/hooks/useUserRole";

const LS = "closetDash:v3";

function titleCase(s = "") {
  return s.toLowerCase().replace(/(^|\s|-|_)\p{L}/gu, (m) => m.toUpperCase());
}
function cleanedFromFileName(fn = "") {
  const base = fn.replace(/\.[a-z0-9]+$/i, "");
  const tokens = base
    .split(/[\s_\-.,]+/)
    .filter((t) => t && !/^\d+$/.test(t))
    .filter((t) => !/^(img|image|screenshot|chatgpt|photo|pxl|mvimg|edited)$/i.test(t))
    .filter((t) => t.length >= 3);
  return titleCase(tokens.slice(0, 5).join(" "));
}
function nameIdeas(it) {
  const ideas = new Set();
  const c = (it.category || "").trim();
  const sc = (it.subcategory || "").trim();
  const ssc = (it.subsubcategory || "").trim();
  if (c || sc || ssc) {
    ideas.add(titleCase([c, sc, ssc].filter(Boolean).join(" ")));
    ideas.add(titleCase([c, sc].filter(Boolean).join(" ")));
  }
  if (it.fileName) {
    const fromFile = cleanedFromFileName(it.fileName);
    if (fromFile) ideas.add(fromFile);
  }
  if (!ideas.size) ideas.add("My Closet Item");
  return Array.from(ideas).slice(0, 6);
}

export default function ClosetDashboard() {
  const uid = auth.currentUser?.uid || null;
  const { role } = useUserRole();
  const canPickTheme = role === "creator" || role === "admin";

  const [rawItems, setRawItems] = useState([]);
  const [thumbs, setThumbs] = useState(new Map());
  const [loading, setLoading] = useState(true);

  // toolbar
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [queryText, setQueryText] = useState("");
  const [search, setSearch] = useState("");
  const debRef = useRef();

  // rename
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [showIdeasFor, setShowIdeasFor] = useState(null);

  // boards
  const [boards, setBoards] = useState([]);

  // themes
  const [themes, setThemes] = useState([]);
  const [themeId, setThemeId] = useState("");

  useEffect(() => {
    if (!uid) return;
    const off = listenBoards(uid, setBoards);
    return () => off?.();
  }, [uid]);

  const onQueryChange = (e) => {
    const v = e.target.value;
    setQueryText(v);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setSearch(v.trim().toLowerCase()), 220);
  };

  // restore toolbar prefs
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS) || "{}");
      if (saved.filterCat) setFilterCat(saved.filterCat);
      if (saved.sortBy) setSortBy(saved.sortBy);
      if (saved.queryText) {
        setQueryText(saved.queryText);
        setSearch(saved.queryText.toLowerCase());
      }
    } catch {}
  }, []);

  // persist toolbar prefs
  useEffect(() => {
    localStorage.setItem(LS, JSON.stringify({ filterCat, sortBy, queryText }));
  }, [filterCat, sortBy, queryText]);

  // load themes catalog (public read)
  useEffect(() => {
    if (!canPickTheme) return;
    const qy = query(collection(db, "themes"), orderBy("label", "asc"));
    const off = onSnapshot(qy, (snap) => {
      setThemes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => off();
  }, [canPickTheme]);

  // live user brand theme
  useEffect(() => {
    if (!uid || !canPickTheme) return;
    const ref = doc(db, `users/${uid}/settings/brand`);
    const off = onSnapshot(ref, (snap) => {
      const tid = snap.exists() ? (snap.data().themeId || "") : "";
      setThemeId(tid);
    });
    return () => off();
  }, [uid, canPickTheme]);

  // live items
  useEffect(() => {
    if (!uid) return;
    const qy = query(collection(db, `users/${uid}/closet`), orderBy("uploadedAt", "desc"));
    const off = onSnapshot(
      qy,
      async (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRawItems(items);
        setLoading(false);

        items.forEach(async (it) => {
          const storagePath = it.path || it.storagePath || "";
          if (it.url || !storagePath || thumbs.has(storagePath)) return;
          try {
            const url = await getDownloadURL(ref(storage, storagePath));
            setThumbs((m) => {
              const n = new Map(m);
              n.set(storagePath, url);
              return n;
            });
          } catch {}
        });
      },
      () => setLoading(false)
    );

    return () => off();
  }, [uid]); // eslint-disable-line

  const categories = useMemo(() => {
    const set = new Set();
    rawItems.forEach((i) => {
      const c = (i.category || "").trim();
      if (c) set.add(c);
    });
    return ["All Categories", ...Array.from(set).sort()];
  }, [rawItems]);

  const items = useMemo(() => {
    let out = rawItems.slice();
    if (filterCat !== "all") {
      out = out.filter((i) => (i.category || "").toLowerCase() === filterCat.toLowerCase());
    }
    if (search) {
      out = out.filter((i) => {
        const hay = `${i.title || ""} ${i.fileName || ""}`.toLowerCase();
        return hay.includes(search);
      });
    }
    if (sortBy === "name") {
      out.sort((a, b) =>
        (a.title || a.fileName || "").localeCompare(b.title || b.fileName || "")
      );
    } else {
      out.sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0));
    }
    return out;
  }, [rawItems, filterCat, search, sortBy]);

  async function handleDelete(it) {
    if (!uid) return;
    if (!window.confirm("Delete this item (and its image)?")) return;
    setRawItems((prev) => prev.filter((x) => x.id !== it.id));
    try {
      await deleteDoc(doc(db, `users/${uid}/closet/${it.id}`));
      const storagePath = it.path || it.storagePath || "";
      if (storagePath) {
        try {
          await deleteObject(ref(storage, storagePath));
          setThumbs((m) => {
            const n = new Map(m);
            n.delete(storagePath);
            return n;
          });
        } catch {}
      }
    } catch (err) {
      console.warn("[closet] delete failed:", err);
    }
  }

  function startRename(it) {
    setEditId(it.id);
    setEditVal(it.title || cleanedFromFileName(it.fileName || "") || "");
    setShowIdeasFor(null);
  }
  function cancelRename() {
    setEditId(null);
    setEditVal("");
    setShowIdeasFor(null);
  }
  async function saveRename(it) {
    const name = editVal.trim();
    if (!name) return cancelRename();
    try {
      await updateDoc(doc(db, `users/${uid}/closet/${it.id}`), {
        title: name,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("rename failed", e);
    } finally {
      cancelRename();
    }
  }

  async function saveTheme(next) {
    if (!uid) return;
    try {
      await setDoc(
        doc(db, `users/${uid}/settings/brand`),
        { uid, themeId: next, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.warn("[brand] save failed", e);
    }
  }

  return (
    <section className="card dashboard" aria-labelledby="closet-dash-title">
      <div className="card__body">
        <h3 id="closet-dash-title" className="card__title">Closet Dashboard</h3>

        {/* Toolbar */}
        <div className="toolbar toolbar--closet">
          <select
            aria-label="Filter by category"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            {categories.map((c) => (
              <option
                key={c}
                value={c === "All Categories" ? "all" : c.toLowerCase()}
              >
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Newest</option>
            <option value="name">Name A–Z</option>
          </select>

          {canPickTheme && (
            <select
              aria-label="Theme"
              value={themeId}
              onChange={(e) => { setThemeId(e.target.value); saveTheme(e.target.value); }}
              title="Theme used for new preview cards"
            >
              <option value="">Theme: default</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.label || t.id}</option>
              ))}
            </select>
          )}

          <input
            type="search"
            placeholder="Search title or file…"
            value={queryText}
            onChange={onQueryChange}
          />
          <span className="muted">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Grid */}
        <div className="dashboard-grid">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <article key={`sk-${i}`} className="closet-card is-skel">
                <div className="closet-thumb"><div className="skel-box" /></div>
                <div className="closet-meta"><div className="skel-line" /><div className="skel-line short" /></div>
              </article>
            ))}

          {!loading && items.length === 0 && (
            <div className="empty"><p>No items yet. Upload something on the left ✨</p></div>
          )}

          {!loading && items.map((it) => {
            const storagePath = it.path || it.storagePath || "";
            // Prefer branded preview if available
            const thumb = it.assets?.preview?.url || it.url || (storagePath ? thumbs.get(storagePath) : "");
            const title = it.title || it.fileName || "Untitled";
            const ideas = nameIdeas(it);
            const editing = editId === it.id;

            return (
              <article key={it.id} className="closet-card">
                <div className="closet-thumb">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                        objectPosition: "center",
                        display: "block"
                      }}
                    />
                  ) : (
                    <span className="closet-thumb__placeholder">no image</span>
                  )}
                  <span className={`badge ${it.visibility === "public" ? "badge--pub" : "badge--priv"}`}>
                    {it.visibility || "private"}
                  </span>
                </div>

                <div className="closet-meta">
                  {!editing ? (
                    <>
                      <div className="title" title={title} onDoubleClick={() => startRename(it)}>
                        {title}
                      </div>
                      <div className="chips">
                        {it.category && <span className="chip">{it.category}</span>}
                        {it.subcategory && <span className="chip">{it.subcategory}</span>}
                        {it.subsubcategory && <span className="chip">{it.subsubcategory}</span>}
                      </div>
                    </>
                  ) : (
                    <div className="rename-wrap">
                      <input
                        className="rename-input"
                        value={editVal}
                        autoFocus
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(it);
                          if (e.key === "Escape") cancelRename();
                        }}
                        placeholder="Enter a better name…"
                      />
                      <div className="rename-actions">
                        <button className="tb-btn" onClick={() => saveRename(it)}>Save</button>
                        <button className="tb-btn" onClick={cancelRename}>Cancel</button>
                        <button
                          className="tb-btn"
                          onClick={() => setShowIdeasFor((p) => (p === it.id ? null : it.id))}
                        >
                          Ideas
                        </button>
                      </div>
                      {showIdeasFor === it.id && (
                        <div className="ideas-pop">
                          {ideas.map((s) => (
                            <button key={s} className="idea" type="button" onClick={() => setEditVal(s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="closet-actions">
                  {/* Add to Board dropdown */}
                  <select
                    onChange={(e) => {
                      const bid = e.target.value;
                      if (!bid) return;
                      addItemToBoard({ uid, boardId: bid, itemId: it.id, previewUrl: thumb, category: it.category || "" });
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="tb-btn"
                    style={{ minWidth: 140 }}
                    aria-label="Add to board"
                  >
                    <option value="" disabled>Add to board…</option>
                    {boards.map(b => (
                      <option key={b.id} value={b.id}>{b.label || b.key}</option>
                    ))}
                  </select>

                  {!editing ? (
                    <>
                      <button className="tb-btn" onClick={() => startRename(it)}>Rename</button>
                      <button className="tb-btn danger" onClick={() => handleDelete(it)}>Delete</button>
                    </>
                  ) : (
                    <span className="muted">Editing…</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <style>{`
        .toolbar--closet { display:flex; gap:.5rem; align-items:center; margin-bottom:.75rem; }
        .toolbar--closet input[type="search"] { flex:1; min-width: 220px; }

        .dashboard-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }

        .closet-card { display:flex; flex-direction:column; gap:.5rem; }
        .closet-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 3/4;
          overflow: hidden;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #eee;
          display: grid;
          place-items: center;
        }
        .closet-thumb__placeholder { position:absolute; inset:0; display:grid; place-items:center; color:#999; font-size:12px; }
        .badge { position:absolute; top:8px; left:8px; font-size:11px; padding:2px 8px; border-radius:999px; color:#fff; background: rgba(0,0,0,.65); }
        .badge--pub { background: rgba(99,102,241,.9); } .badge--priv { background: rgba(107,114,128,.9); }

        .closet-meta .title { font-weight:600; font-size:.95rem; cursor:text; }
        .chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
        .chip { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f3f4f6; color:#374151; border:1px solid #e5e7eb; }

        .closet-actions { display:flex; gap:.5rem; flex-wrap: wrap; }
        .tb-btn { font-size:.9rem; padding:.35rem .6rem; border-radius:8px; border:1px solid #e5e7eb; background:#fff; }
        .tb-btn:hover { background:#f9f9fb; }
        .tb-btn.danger { color:#b91c1c; border-color:#fca5a5; background:#fff5f5; }
        .tb-btn.danger:hover { background:#ffe9e9; }

        .rename-wrap { display:flex; flex-direction:column; gap:.4rem; }
        .rename-input { width:100%; padding:.45rem .6rem; border-radius:8px; border:1px solid #e5e7eb; }
        .rename-actions { display:flex; gap:.4rem; }
        .ideas-pop { margin-top:.25rem; display:flex; gap:.25rem; flex-wrap:wrap; }
        .ideas-pop .idea { border:1px dashed #d1d5db; background:#fbfbff; border-radius:999px; padding:.2rem .6rem; font-size:.85rem; }
        .ideas-pop .idea:hover { background:#f0f0ff; }

        .closet-card.is-skel .skel-box { width:100%; height:100%; aspect-ratio:3/4; border-radius:10px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 37%,#eee 63%); background-size: 400% 100%; animation: shimmer 1.1s infinite linear; }
        .closet-card.is-skel .skel-line { height:12px; margin-top:8px; border-radius:6px; background:#eee; }
        .closet-card.is-skel .skel-line.short { width:60%; }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:0 0} }

        .empty { padding: 1.25rem; color:#6b7280; }
      `}</style>
    </section>
  );
}
