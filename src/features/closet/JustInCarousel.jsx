// src/features/closet/JustInCarousel.jsx
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit as fbLimit, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

export default function JustInCarousel({ limit = 12, className = "" }) {
  const [items, setItems] = useState([]);
  const [urls, setUrls]   = useState({}); // storagePath -> resolved URL
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Load recent items for the signed-in user
  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    const load = async (user) => {
      setLoading(true);
      setErr(null);
      if (!user) { if (!cancelled) { setItems([]); setLoading(false); } return; }

      try {
        const q = query(
          collection(db, `users/${user.uid}/closet`),
          orderBy("uploadedAt", "desc"),
          fbLimit(limit)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // initial + on auth change
    load(auth.currentUser);
    unsub = onAuthStateChanged(auth, load);
    return () => { cancelled = true; unsub && unsub(); };
  }, [limit]);

  // Resolve download URLs for any items that only have a storage path
  useEffect(() => {
    let alive = true;

    (async () => {
      const toFetch = [];
      for (const it of items) {
        const path = it.path || it.storagePath || "";
        const direct = it.imageUrl || it.url;
        if (!direct && path && !urls[path]) toFetch.push(path);
      }
      for (const path of toFetch) {
        try {
          const u = await getDownloadURL(ref(storage, path));
          if (!alive) return;
          setUrls(prev => ({ ...prev, [path]: u }));
        } catch {
          // ignore missing/unauthorized — card will show placeholder
        }
      }
    })();

    return () => { alive = false; };
  }, [items, urls]);

  if (loading) return <p className="muted op-70">Loading…</p>;
  if (err)     return <p className="muted op-70">Couldn’t load items.</p>;
  if (items.length === 0) return <p className="muted op-70">No recent items found.</p>;

  return (
    <div className={`justin-row ${className}`}>
      {items.map((it) => {
        const path = it.path || it.storagePath || "";
        const src  = it.imageUrl || it.url || (path ? urls[path] : "");
        const alt  = it.title || it.fileName || it.category || "Closet item";
        return (
          <div className="justin-card" key={it.id} title={alt}>
            {src
              ? <img src={src} alt={alt} loading="lazy" decoding="async" />
              : <div className="justin-skel" aria-hidden />
            }
            {it.category && <span className="justin-badge">{it.category}</span>}
          </div>
        );
      })}
    </div>
  );
}
