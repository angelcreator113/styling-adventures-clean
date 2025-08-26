// src/pages/creator/SpaceDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { auth, db } from "@/utils/init-firebase";
import {
  collection, onSnapshot, orderBy, query, where,
  doc, getDoc
} from "firebase/firestore";

export default function SpaceDashboard() {
  const { spaceId } = useParams();
  const uid = auth.currentUser?.uid;
  const nav = useNavigate();

  const [space, setSpace] = useState(null);
  const [items, setItems] = useState([]);
  const [qStr, setQStr] = useState("");
  const [catId, setCatId] = useState("");
  const [folderId, setFolderId] = useState("");
  const [cats, setCats] = useState([]);
  const [folders, setFolders] = useState([]);

  // space meta
  useEffect(() => {
    if (!uid || !spaceId) return;
    getDoc(doc(db, `users/${uid}/spaces/${spaceId}`)).then(s => setSpace(s.exists() ? ({id:s.id, ...s.data()}) : null));
  }, [uid, spaceId]);

  // categories
  useEffect(() => {
    if (!uid || !spaceId) { setCats([]); setCatId(""); return; }
    const qq = query(collection(db, `users/${uid}/spaces/${spaceId}/categories`), orderBy("createdAt","asc"));
    return onSnapshot(qq, snap => setCats(snap.docs.map(d => ({id:d.id, ...d.data()}))));
  }, [uid, spaceId]);

  // folders (depend on cat)
  useEffect(() => {
    if (!uid || !spaceId || !catId) { setFolders([]); setFolderId(""); return; }
    const qq = query(collection(db, `users/${uid}/spaces/${spaceId}/categories/${catId}/folders`), orderBy("createdAt","asc"));
    return onSnapshot(qq, snap => setFolders(snap.docs.map(d => ({id:d.id, ...d.data()}))));
  }, [uid, spaceId, catId]);

  // items
  useEffect(() => {
    if (!uid || !spaceId) { setItems([]); return; }
    let qq = query(collection(db, `users/${uid}/spaces/${spaceId}/items`), orderBy("createdAt","desc"));
    if (catId)   qq = query(qq, where("catId", "==", catId));
    if (folderId) qq = query(qq, where("folderId", "==", folderId));
    return onSnapshot(qq, snap => setItems(snap.docs.map(d => ({id:d.id, ...d.data()}))));
  }, [uid, spaceId, catId, folderId]);

  const filtered = useMemo(() => {
    const s = qStr.trim().toLowerCase();
    if (!s) return items;
    return items.filter(it =>
      (it.title || "").toLowerCase().includes(s) ||
      (it.fileName || "").toLowerCase().includes(s)
    );
  }, [qStr, items]);

  return (
    <section className="container" style={{padding:16}}>
      <div className="top-row" style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <h1 className="page-title" style={{margin:0,flex:1}}>
          Space: {space?.name || "—"}
        </h1>
        <input
          className="input__field"
          placeholder="Search title or file…"
          value={qStr}
          onChange={(e)=>setQStr(e.target.value)}
          style={{maxWidth:320}}
        />
        <Link className="btn" to={`/creator/spaces/${spaceId}/upload`}>Upload</Link>
        <button className="btn" onClick={()=>nav("/creator/spaces")}>All Spaces</button>
      </div>

      <div className="filters" style={{display:"flex",gap:10,marginBottom:12}}>
        <label className="input" style={{maxWidth:280}}>
          <div className="input__label">Category</div>
          <select className="select" value={catId} onChange={e => setCatId(e.target.value)}>
            <option value="">— all —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.title || c.id}</option>)}
          </select>
        </label>
        <label className="input" style={{maxWidth:280}}>
          <div className="input__label">Subfolder</div>
          <select className="select" value={folderId} onChange={e => setFolderId(e.target.value)} disabled={!catId}>
            <option value="">— all —</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.title || f.id}</option>)}
          </select>
        </label>
      </div>

      {!filtered.length ? (
        <div className="dashboard-card" style={{padding:16}}>No items yet in this Space.</div>
      ) : (
        <div className="grid" style={{display:"grid",gap:12,gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))"}}>
          {filtered.map(it => (
            <article key={it.id} className="dashboard-card" style={{padding:8}}>
              <div
                style={{
                  width:"100%", aspectRatio:"3/4", borderRadius:12, border:"1px solid #eee",
                  backgroundColor:"#fff", backgroundImage:`url("${it.previewUrl || it.fileUrl || ""}")`,
                  backgroundSize:"cover", backgroundPosition:"center"
                }}
              />
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis"}}>
                  {it.title || "Item"}
                </div>
                {/* delete action can live here later */}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
