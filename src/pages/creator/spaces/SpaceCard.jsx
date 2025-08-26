import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/utils/init-firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { uploadFileWithProgress } from "@/utils/firebase-helpers";

function timeAgo(ts) {
  try {
    const ms = ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);
    if (!ms) return "";
    const diff = Date.now() - ms;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  } catch { return ""; }
}

export default function SpaceCard({ uid, space }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pickCoverRef = useRef(null);

  async function rename() {
    const next = prompt("Rename space:", space.name || "Untitled Space");
    if (!next || next.trim() === space.name) return;
    await updateDoc(doc(db, `users/${uid}/spaces/${space.id}`), {
      name: next.trim(),
      lastUpdatedAt: serverTimestamp()
    });
  }

  async function changeCover(file) {
    if (!file) return;
    const res = await uploadFileWithProgress(file, {
      slug: `spaces_covers/${uid}/${space.id}`,
      public: true, // safe to be public; it’s only a card cover
      preferServer: true,
      metadata: { uid, spaceId: space.id, contentType: file.type || "image/jpeg" },
    });
    const coverUrl = res?.assets?.file?.url || res?.downloadURL || "";
    await updateDoc(doc(db, `users/${uid}/spaces/${space.id}`), {
      coverUrl,
      coverStoragePath: res?.fullPath || null,
      lastUpdatedAt: serverTimestamp()
    });
  }

  function onPick(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) changeCover(f);
  }

  async function archiveToggle() {
    const to = space.status === "archived" ? "active" : "archived";
    await updateDoc(doc(db, `users/${uid}/spaces/${space.id}`), {
      status: to,
      lastUpdatedAt: serverTimestamp()
    });
  }

  async function remove() {
    if (!confirm("Delete this Space? (Items won’t be auto-removed from storage.)")) return;
    await deleteDoc(doc(db, `users/${uid}/spaces/${space.id}`));
  }

  return (
    <div className="dashboard-card" style={{ padding: 12, position: "relative" }}>
      <Link to={`/creator/spaces/${space.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div
          style={{
            height: 150,
            borderRadius: 12,
            border: "1px solid #eee",
            background: space.coverUrl
              ? `url("${space.coverUrl}") center/cover no-repeat`
              : "linear-gradient(180deg,#faf7ff,#fff)"
          }}
        />
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {space.name || "Untitled Space"}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {(space.itemCount || 0)} files • {timeAgo(space.lastUpdatedAt)}
            </div>
          </div>
          <button className="btn sm ghost" type="button" onClick={(e)=>{e.preventDefault(); setMenuOpen(v=>!v);}}>
            ⋯
          </button>
        </div>
      </Link>

      {menuOpen && (
        <div className="menu" style={{
          position:"absolute", right:12, top:12, background:"#fff",
          border:"1px solid #eee", borderRadius:12, padding:8, zIndex:5, width:180
        }}>
          <button className="btn sm w-full" onClick={rename}>Rename</button>
          <button className="btn sm w-full" onClick={()=>pickCoverRef.current?.click()}>Change cover</button>
          <button className="btn sm w-full" onClick={archiveToggle}>
            {space.status === "archived" ? "Unarchive" : "Archive"}
          </button>
          <button className="btn sm danger w-full" onClick={remove}>Delete</button>
        </div>
      )}

      <input ref={pickCoverRef} type="file" hidden accept="image/*" onChange={onPick} />
    </div>
  );
}
