// src/components/BoardView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { reorderBoardItems, setBoardPublic } from "@/utils/board-helpers";

export default function BoardView({ board }) {
  const uid = auth.currentUser?.uid;
  const [items, setItems] = useState([]);
  const [isPublic, setIsPublic] = useState(!!board?.public);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setIsPublic(!!board?.public);
  }, [board?.public]);

  useEffect(() => {
    if (!uid || !board?.id) return;
    const qy = query(collection(db, `users/${uid}/boards/${board.id}/items`), orderBy("order", "asc"));
    const off = onSnapshot(qy, (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => off?.();
  }, [uid, board?.id]);

  async function remove(boardItemId) {
    if (!uid || !board?.id) return;
    await deleteDoc(doc(db, `users/${uid}/boards/${board.id}/items/${boardItemId}`));
  }

  function makeShareUrl(shareId) {
    return `${window.location.origin}/b/${uid}/${board.id}?s=${shareId || board?.shareId || ""}`;
  }

  async function togglePublic(v) {
    if (!uid || !board?.id) return;
    const { shareId } = await setBoardPublic({ uid, boardId: board.id, publicOn: v });
    setIsPublic(!!v);
    setShareUrl(makeShareUrl(shareId));
  }

  // --- drag to reorder (vanilla) ---
  const [dragId, setDragId] = useState(null);
  const orderedDocIds = useMemo(() => items.map(i => i.id), [items]);

  function onDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  async function onDrop(e, overId) {
    e.preventDefault();
    if (!dragId || !overId || dragId === overId) return;
    const from = orderedDocIds.indexOf(dragId);
    const to   = orderedDocIds.indexOf(overId);
    if (from < 0 || to < 0) return;
    const next = orderedDocIds.slice();
    next.splice(to, 0, next.splice(from, 1)[0]);
    await reorderBoardItems({ uid, boardId: board.id, orderedItemDocIds: next });
    setDragId(null);
  }

  return (
    <section className="card">
      <div className="card__body">
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap"}}>
          <h3 className="card__title" style={{margin:0}}>{board?.label || board?.key}</h3>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <label className="tool-check" title="Let anyone view this board via a link">
              <input type="checkbox" checked={isPublic} onChange={(e)=>togglePublic(e.target.checked)} />
              <span className="tool-title">Public link</span>
            </label>
            {isPublic && (
              <button
                className="tb-btn"
                onClick={() => {
                  const u = shareUrl || makeShareUrl(board?.shareId);
                  navigator.clipboard?.writeText(u);
                  alert("Share link copied!");
                }}
              >
                Copy link
              </button>
            )}
          </div>
        </div>

        <div className="masonry">
          {items.map(it => (
            <div
              key={it.id}
              className={`pin ${dragId === it.id ? "dragging" : ""}`}
              draggable
              onDragStart={(e)=>onDragStart(e, it.id)}
              onDragOver={onDragOver}
              onDrop={(e)=>onDrop(e, it.id)}
              title="Drag to reorder"
            >
              {it.previewUrl
                ? <img src={it.previewUrl} alt="" loading="lazy" decoding="async" />
                : <div className="ph" />}
              <div className="pin-actions">
                <button className="tb-btn danger" onClick={() => remove(it.id)}>Remove</button>
              </div>
            </div>
          ))}
          {!items.length && <div className="muted">No items yet.</div>}
        </div>
      </div>

      <style>{`
        .masonry { column-width: 260px; column-gap: 16px; }
        .pin { break-inside: avoid; margin: 0 0 16px; border:1px solid #eee; border-radius: 14px; overflow: hidden; background:#fff; cursor: grab; }
        .pin.dragging { opacity:.6; }
        .pin img, .pin .ph { width:100%; display:block; }
        .pin .ph { height: 240px; background:#f3f4f6; }
        .pin-actions { display:flex; justify-content:flex-end; padding:8px; }
        .tb-btn { font-size:.85rem; padding:.3rem .55rem; border-radius:8px; border:1px solid #e5e7eb; background:#fff; }
        .tb-btn.danger { color:#b91c1c; border-color:#fca5a5; background:#fff5f5; }
      `}</style>
    </section>
  );
}
