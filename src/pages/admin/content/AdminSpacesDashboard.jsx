import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/init-firebase";
import {
  collectionGroup,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Search, Archive, ArchiveRestore, Trash2, Users } from "lucide-react";

/**
 * AdminSpacesDashboard
 * - Admin-only. View/search every creator's spaces (collectionGroup).
 * - Moderate items (Archive/Restore/Delete).
 * - Adjust limits:
 *     - Global: app_settings/spaces { maxSpacesGlobal }
 *     - Per-user: users/{uid}/settings/limits { maxSpaces }
 *
 * NOTE: Make sure your Firestore rules allow admin reads of collectionGroup:
 *   match /{path=**}/spaces/{spaceId} { allow read, write: if isAdmin(); }
 */

const PAGE_SIZE = 24;

export default function AdminSpacesDashboard() {
  const [qText, setQText] = useState("");
  const [status, setStatus] = useState("all"); // all | active | archived
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  // limits
  const [globalMax, setGlobalMax] = useState("");
  const [uidForLimit, setUidForLimit] = useState("");
  const [userMax, setUserMax] = useState("");

  const statusFilter = useMemo(() => {
    if (status === "active") return where("status", "==", "active");
    if (status === "archived") return where("status", "==", "archived");
    return null;
  }, [status]);

  async function loadPage(next = false) {
    setLoading(true);
    try {
      const clauses = [orderBy("updatedAt", "desc")];
      if (statusFilter) clauses.unshift(statusFilter);

      // collectionGroup query across all creators: users/*/spaces/*
      let base = query(collectionGroup(db, "spaces"), ...clauses, limit(PAGE_SIZE));
      if (next && cursor) {
        base = query(collectionGroup(db, "spaces"), ...clauses, startAfter(cursor), limit(PAGE_SIZE));
      }

      const snap = await getDocs(base);
      const rows = [];
      snap.forEach((d) => rows.push({ id: d.id, path: d.ref.path, ...d.data() }));
      setItems((prev) => (next ? [...prev, ...rows] : rows));
      setCursor(snap.docs[snap.docs.length - 1] || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return items;
    return items.filter((it) => {
      const hay = `${it.name || ""} ${it.uid || ""} ${it.spaceId || ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [qText, items]);

  async function setGlobalLimit() {
    const n = parseInt(globalMax, 10);
    if (!Number.isFinite(n) || n < 0) return alert("Enter a valid number");
    await setDoc(doc(db, "app_settings", "spaces"), { maxSpacesGlobal: n, updatedAt: serverTimestamp() }, { merge: true });
    alert("Global limit saved");
  }

  async function setUserLimit() {
    const n = parseInt(userMax, 10);
    if (!uidForLimit) return alert("Enter a creator UID");
    if (!Number.isFinite(n) || n < 0) return alert("Enter a valid number");
    await setDoc(doc(db, `users/${uidForLimit}/settings/limits`), { maxSpaces: n, updatedAt: serverTimestamp() }, { merge: true });
    alert("Per-user limit saved");
  }

  // Moderation actions
  async function archive(space) {
    await updateDoc(doc(db, space.path), { status: "archived", updatedAt: serverTimestamp() });
    setItems((rows) => rows.map((r) => (r.path === space.path ? { ...r, status: "archived" } : r)));
  }
  async function restore(space) {
    await updateDoc(doc(db, space.path), { status: "active", updatedAt: serverTimestamp() });
    setItems((rows) => rows.map((r) => (r.path === space.path ? { ...r, status: "active" } : r)));
  }
  async function remove(space) {
    if (!confirm("Delete this space? This cannot be undone.")) return;
    await deleteDoc(doc(db, space.path));
    setItems((rows) => rows.filter((r) => r.path !== space.path));
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <h1 className="page-title" style={{ marginTop: 0 }}>Admin — Spaces</h1>

      {/* Controls row */}
      <div className="dashboard-card" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr auto auto" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={16} />
          <input
            className="input"
            placeholder="Search by name or creator UID…"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button className="btn" onClick={() => loadPage(false)} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Limits row */}
      <div className="dashboard-card" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr auto 1fr 1fr auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} />
          <strong>Global spaces limit</strong>
        </div>
        <input className="input" placeholder="e.g. 10" value={globalMax} onChange={(e) => setGlobalMax(e.target.value)} />
        <button className="btn" onClick={setGlobalLimit}>Save</button>

        <input className="input" placeholder="Creator UID" value={uidForLimit} onChange={(e) => setUidForLimit(e.target.value)} />
        <input className="input" placeholder="e.g. 5" value={userMax} onChange={(e) => setUserMax(e.target.value)} />
        <button className="btn" onClick={setUserLimit}>Save</button>
      </div>

      {/* Grid */}
      <div className="dashboard-card" style={{ marginTop: 12 }}>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {filtered.map((it) => (
            <article key={it.path} className="card" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{it.name || it.spaceId || "Untitled space"}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                <div>Creator: {it.uid || "(unknown)"}</div>
                <div>Space ID: {it.spaceId || "(—)"} </div>
                <div>Status: {it.status || "active"}</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn" onClick={() => archive(it)} title="Archive">
                  <Archive size={16} /> Archive
                </button>
                <button className="btn" onClick={() => restore(it)} title="Restore">
                  <ArchiveRestore size={16} /> Restore
                </button>
                <button className="btn btn-danger" onClick={() => remove(it)} title="Delete">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button className="btn" onClick={() => loadPage(true)} disabled={loading || !cursor}>
            {cursor ? "Load more" : "No more results"}
          </button>
        </div>
      </div>
    </section>
  );
}
