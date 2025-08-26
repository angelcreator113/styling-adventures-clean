// src/components/files/FilesBrowser.jsx
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

/**
 * Schema this component expects (owner = current user):
 * users/{uid}/files/{categoryId}           -> { name, createdAt }
 * users/{uid}/files/{categoryId}/folders/{folderId} -> { name, createdAt }
 * users/{uid}/files/{categoryId}/folders/{folderId}/items/{itemId} -> { title, previewUrl?, fileUrl?, createdAt }
 */

const styles = {
  wrap:  { display: "grid", gridTemplateColumns: "240px 260px 1fr", gap: 16 },
  col:   { background:"#fff", border:"1px solid #eee", borderRadius:12, padding:12, minHeight:420 },
  head:  { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 },
  h6:    { margin:0, fontSize:14, fontWeight:700, color:"#111827" },
  list:  { display:"grid", gap:6 },
  pill:  (active)=>({
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 10px", borderRadius:10, cursor:"pointer",
          background: active ? "#EEF2FF" : "#F9FAFB", border:"1px solid #E5E7EB",
          color: active ? "#4338CA" : "#111827", fontWeight: active ? 600 : 500
        }),
  grid:  { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:12 },
  card:  { border:"1px solid #eee", borderRadius:12, padding:10, background:"#fff" },
  thumb: { width:"100%", aspectRatio:"1/1", background:"#f8fafc", border:"1px solid #f1f5f9",
           borderRadius:10, display:"grid", placeItems:"center", fontSize:12, color:"#64748b" },
  row:   { display:"flex", gap:8, alignItems:"center" },
  btn:   { padding:"6px 10px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:12 },
  btnP:  { padding:"6px 10px", borderRadius:8, border:"1px solid #c4b5fd", background:"#ede9fe", color:"#6d28d9", cursor:"pointer", fontSize:12, fontWeight:600 },
  input: { width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff" },
  empty: { padding:"12px", border:"1px dashed #e5e7eb", borderRadius:12, color:"#6b7280", textAlign:"center" },
  tiny:  { fontSize:12, color:"#6b7280" },
};

function useColSnapshot(path, opts) {
  const { order = "createdAt" } = opts || {};
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    if (!path) { setDocs([]); return; }
    const q = query(collection(db, path), orderBy(order, "asc"));
    const off = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return off;
  }, [path, order]);
  return docs;
}

export default function FilesBrowser() {
  const user = auth.currentUser;
  const uid  = user?.uid;

  // selection
  const [catId, setCatId]       = useState(null);
  const [folderId, setFolderId] = useState(null);

  // paths
  const catsPath    = uid ? `users/${uid}/files` : null;
  const foldersPath = uid && catId ? `users/${uid}/files/${catId}/folders` : null;
  const itemsPath   = uid && catId && folderId ? `users/${uid}/files/${catId}/folders/${folderId}/items` : null;

  // live collections
  const categories = useColSnapshot(catsPath);
  const folders    = useColSnapshot(foldersPath);
  const items      = useColSnapshot(itemsPath);

  // ensure selection stays valid as lists change
  useEffect(() => {
    if (categories.length && !catId) setCatId(categories[0].id);
    if (!categories.length) { setCatId(null); setFolderId(null); }
  }, [categories, catId]);
  useEffect(() => {
    if (folders.length && !folderId) setFolderId(folders[0].id);
    if (!folders.length) setFolderId(null);
  }, [folders, folderId]);

  if (!uid) {
    return (
      <div style={styles.empty}>
        Please sign in to use Creator Files.
      </div>
    );
  }

  async function addCategory() {
    const name = prompt("New category name?");
    if (!name) return;
    await addDoc(collection(db, catsPath), { name: name.trim(), createdAt: serverTimestamp() });
  }
  async function renameCategory(id, cur) {
    const name = prompt("Rename category:", cur || "");
    if (!name) return;
    await updateDoc(doc(db, `${catsPath}/${id}`), { name: name.trim() });
  }
  async function deleteCategory(id) {
    if (!confirm("Delete this category (and its folders/items)? This cannot be undone.")) return;
    await deleteDoc(doc(db, `${catsPath}/${id}`));
    if (catId === id) { setCatId(null); setFolderId(null); }
  }

  async function addFolder() {
    if (!catId) return;
    const name = prompt("New subfolder name?");
    if (!name) return;
    await addDoc(collection(db, foldersPath), { name: name.trim(), createdAt: serverTimestamp() });
  }
  async function renameFolder(id, cur) {
    const name = prompt("Rename folder:", cur || "");
    if (!name) return;
    await updateDoc(doc(db, `${foldersPath}/${id}`), { name: name.trim() });
  }
  async function deleteFolder(id) {
    if (!confirm("Delete this folder (and its items)?")) return;
    await deleteDoc(doc(db, `${foldersPath}/${id}`));
    if (folderId === id) setFolderId(null);
  }

  async function addItem() {
    if (!itemsPath) return;
    const title = prompt("Item title?");
    if (!title) return;
    // Minimal placeholder item. Later we can attach the upload pipeline and write fileUrl/previewUrl.
    await addDoc(collection(db, itemsPath), {
      title: title.trim(),
      createdAt: serverTimestamp(),
      previewUrl: "",
      fileUrl: "",
    });
  }
  async function renameItem(id, cur) {
    const title = prompt("Rename item:", cur || "");
    if (!title) return;
    await updateDoc(doc(db, `${itemsPath}/${id}`), { title: title.trim() });
  }
  async function deleteItem(id) {
    if (!confirm("Delete this item?")) return;
    await deleteDoc(doc(db, `${itemsPath}/${id}`));
  }

  const catName    = useMemo(() => categories.find(c => c.id === catId)?.name || "—", [categories, catId]);
  const folderName = useMemo(() => folders.find(f => f.id === folderId)?.name || "—", [folders, folderId]);

  return (
    <div style={styles.wrap}>
      {/* Categories */}
      <div style={styles.col}>
        <div style={styles.head}>
          <h6 style={styles.h6}>Categories</h6>
          <button style={styles.btnP} onClick={addCategory}>+ New</button>
        </div>
        <div style={styles.list}>
          {categories.map(c => (
            <div key={c.id} style={styles.pill(c.id === catId)} onClick={() => setCatId(c.id)}>
              <span>{c.name || "Untitled"}</span>
              <span style={styles.row}>
                <button title="Rename" style={styles.btn} onClick={(e)=>{e.stopPropagation(); renameCategory(c.id, c.name);}}>✏️</button>
                <button title="Delete" style={styles.btn} onClick={(e)=>{e.stopPropagation(); deleteCategory(c.id);}}>🗑️</button>
              </span>
            </div>
          ))}
          {!categories.length && <div style={styles.empty}>No categories yet.</div>}
        </div>
      </div>

      {/* Folders */}
      <div style={styles.col}>
        <div style={styles.head}>
          <h6 style={styles.h6}>Subfolders {catId ? <span style={styles.tiny}>in “{catName}”</span> : null}</h6>
          <button style={styles.btnP} onClick={addFolder} disabled={!catId}>+ New</button>
        </div>
        <div style={styles.list}>
          {folders.map(f => (
            <div key={f.id} style={styles.pill(f.id === folderId)} onClick={() => setFolderId(f.id)}>
              <span>{f.name || "Untitled"}</span>
              <span style={styles.row}>
                <button title="Rename" style={styles.btn} onClick={(e)=>{e.stopPropagation(); renameFolder(f.id, f.name);}}>✏️</button>
                <button title="Delete" style={styles.btn} onClick={(e)=>{e.stopPropagation(); deleteFolder(f.id);}}>🗑️</button>
              </span>
            </div>
          ))}
          {!folders.length && <div style={styles.empty}>No subfolders yet.</div>}
        </div>
      </div>

      {/* Items */}
      <div style={styles.col}>
        <div style={styles.head}>
          <h6 style={styles.h6}>Items {folderId ? <span style={styles.tiny}>in “{folderName}”</span> : null}</h6>
          <div style={styles.row}>
            {/* This button creates a placeholder doc. Later we’ll wire it to your upload pipeline. */}
            <button style={styles.btnP} onClick={addItem} disabled={!folderId}>+ New Item</button>
          </div>
        </div>

        {!!folderId ? (
          items.length ? (
            <div style={styles.grid}>
              {items.map(it => (
                <article key={it.id} style={styles.card}>
                  <div style={styles.thumb}>
                    {it.previewUrl ? <img src={it.previewUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}/> : "No preview"}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                    <div style={{fontSize:13,fontWeight:600}}>{it.title || "Untitled"}</div>
                    <div style={styles.row}>
                      <button title="Rename" style={styles.btn} onClick={()=>renameItem(it.id, it.title)}>✏️</button>
                      <button title="Delete" style={styles.btn} onClick={()=>deleteItem(it.id)}>🗑️</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={styles.empty}>No items in this folder yet.</div>
          )
        ) : (
          <div style={styles.empty}>Choose a subfolder to see items.</div>
        )}
      </div>
    </div>
  );
}
