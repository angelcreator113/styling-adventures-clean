// src/components/spaces/SpaceSelect.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";

export default function SpaceSelect({ value, onChange, onOpenCreate }) {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const qref = query(collection(db, `users/${u.uid}/panels`), orderBy("createdAt", "asc"));
    const off = onSnapshot(qref, (snap) => {
      setSpaces(snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })));
    });
    return off;
  }, []);

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        className="input"
        style={{ flex: 1 }}
      >
        <option value="">— choose a Space —</option>
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>{s.name || "Untitled Space"}</option>
        ))}
      </select>
      <button type="button" className="btn sm" onClick={onOpenCreate}>+ New</button>
    </div>
  );
}
