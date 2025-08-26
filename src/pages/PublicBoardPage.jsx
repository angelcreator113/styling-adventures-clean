// src/pages/PublicBoardPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "@/utils/init-firebase";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function PublicBoardPage() {
  const { uid, boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      const bRef = doc(db, `users/${uid}/boards/${boardId}`);
      const bSnap = await getDoc(bRef);
      if (!bSnap.exists() || bSnap.data()?.public !== true) {
        setBoard({ notFound: true });
        return;
      }
      setBoard({ id: boardId, uid, ...bSnap.data() });
      const qy = query(collection(db, `users/${uid}/boards/${boardId}/items`), orderBy("order", "asc"));
      const off = onSnapshot(qy, (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => off?.();
    }
    load();
  }, [uid, boardId]);

  if (!board) return <div className="card"><div className="card__body">Loading…</div></div>;
  if (board.notFound) return <div className="card"><div className="card__body">Board not found or not public.</div></div>;

  return (
    <section className="card">
      <div className="card__body">
        <h3 className="card__title" style={{marginBottom:8}}>{board.label || board.key}</h3>
        <div className="masonry">
          {items.map(it => (
            <div key={it.id} className="pin">
              {it.previewUrl
                ? <img src={it.previewUrl} alt="" loading="lazy" decoding="async" />
                : <div className="ph" />}
            </div>
          ))}
          {!items.length && <div className="muted">No items yet.</div>}
        </div>
      </div>

      <style>{`
        .masonry { column-width: 260px; column-gap: 16px; }
        .pin { break-inside: avoid; margin: 0 0 16px; border:1px solid #eee; border-radius: 14px; overflow: hidden; background:#fff; }
        .pin img, .pin .ph { width:100%; display:block; }
        .pin .ph { height: 240px; background:#f3f4f6; }
      `}</style>
    </section>
  );
}
