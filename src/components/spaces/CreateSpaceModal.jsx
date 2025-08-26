// src/components/spaces/CreateSpaceModal.jsx
import React, { useState, useEffect } from "react";
import { auth, db } from "@/utils/init-firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

export default function CreateSpaceModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const u = auth.currentUser;
        if (!u) return;
        const snap = await getDocs(collection(db, `users/${u.uid}/panels`));
        setLimitReached(snap.size >= 2); // max 2 spaces
      } catch {}
    })();
  }, [open]);

  async function create() {
    if (!name.trim()) return;
    if (limitReached) return alert("Limit reached (2 Spaces).");
    const u = auth.currentUser;
    if (!u) return;
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, `users/${u.uid}/panels`), {
        name: name.trim(),
        createdAt: serverTimestamp(),
      });
      onCreated?.(ref.id);
      setName("");
      onClose?.();
    } catch (e) {
      alert("Could not create space.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
        display: "grid", placeItems: "center", zIndex: 60
      }}>
      <div className="dashboard-card" style={{ width: 420, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Create a Space</h3>
        <p className="muted">A Space groups your uploads (max 2).</p>
        <input
          className="input"
          placeholder="Space name (e.g., Summer TikToks)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginTop: 8 }}
        />
        {limitReached && (
          <div className="muted" style={{ marginTop: 8 }}>
            You already have 2 Spaces. Delete one to create another.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={create} disabled={busy || !name.trim() || limitReached}>
            {busy ? "Creating…" : "Create Space"}
          </button>
        </div>
      </div>
    </div>
  );
}
