// src/components/BoardsGallery.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function BoardsGallery({ onOpen }) {
  const uid = auth.currentUser?.uid;
  const [boards, setBoards] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!uid) return;
    const off = onSnapshot(collection(db, `users/${uid}/boards`), (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBoards(arr);
      arr.forEach(b => {
        onSnapshot(collection(db, `users/${uid}/boards/${b.id}/items`), (s) => {
          setCounts(c => ({ ...c, [b.id]: s.size }));
        });
      });
    });
    return () => off?.();
  }, [uid]);

  return (
    <section className="card">
      <div className="card__body">
        <h3 className="card__title">My Boards</h3>
        <div className="boards-grid">
          {boards.map(b => (
            <button key={b.id} className="board-card" onClick={() => onOpen?.(b)}>
              {b.coverUrl
                ? <img src={b.coverUrl} alt="" className="cover" loading="lazy" decoding="async" />
                : <div className="cover placeholder" />}
              <div className="meta">
                <div className="label">{b.label || b.key}</div>
                <div className="muted">{counts[b.id] ?? 0} item{(counts[b.id] ?? 0) !== 1 ? "s" : ""}</div>
              </div>
            </button>
          ))}
          {!boards.length && <div className="muted">No boards yet. Create one in the Toolbox → Boards tab.</div>}
        </div>
      </div>

      <style>{`
        .boards-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:16px; }
        .board-card { text-align:left; border:1px solid #eee; background:#fff; border-radius:14px; overflow:hidden; padding:0; cursor:pointer; }
        .board-card .cover { width:100%; height:180px; object-fit:cover; display:block; }
        .board-card .cover.placeholder { background: #f3f4f6; }
        .board-card .meta { padding:10px 12px; }
        .board-card .label { font-weight:600; }
      `}</style>
    </section>
  );
}
