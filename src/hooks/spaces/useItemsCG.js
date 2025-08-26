import { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/init-firebase";
import { collectionGroup, onSnapshot, orderBy, query, where } from "firebase/firestore";

/**
 * Items across root/category/folder using collectionGroup('items').
 * Filters: catId, folderId, status ('active'|'archived'|'all'), text search (client).
 */
export default function useItemsCG({ uid, spaceId, catId, folderId, status = "active", qText = "" }) {
  const [items, setItems] = useState([]);
  const [indexPending, setIndexPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !spaceId) { setItems([]); setIndexPending(false); return; }

    setIndexPending(false);
    setError(null);

    const conds = [ where("uid","==",uid), where("spaceId","==",spaceId) ];
    if (catId)    conds.push(where("catId","==",catId));
    if (folderId) conds.push(where("folderId","==",folderId));
    if (status !== "all") conds.push(where("status","==",status));

    const qq = query(collectionGroup(db, "items"), ...conds, orderBy("createdAt","desc"));

    return onSnapshot(qq,
      (snap) => {
        setItems(snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() })));
      },
      (err) => {
        setError(err);
        if (err?.code === "failed-precondition") setIndexPending(true);
      }
    );
  }, [uid, spaceId, catId, folderId, status]);

  const filtered = useMemo(() => {
    const s = (qText || "").trim().toLowerCase();
    if (!s) return items;
    return items.filter(it =>
      (it.title || "").toLowerCase().includes(s) ||
      (it.fileName || "").toLowerCase().includes(s)
    );
  }, [items, qText]);

  return { items: filtered, rawItems: items, count: filtered.length, indexPending, error };
}
