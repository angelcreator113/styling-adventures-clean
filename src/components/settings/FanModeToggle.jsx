import React, { useEffect, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Icon from "@/components/Icon.jsx";

export default function FanModeToggle({ compact = false }) {
  const uid = auth.currentUser?.uid || null;
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!uid) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, `users/${uid}/settings/profile`));
        if (mounted) setEnabled(!!snap.data()?.fanEnabled);
      } catch {}
      if (mounted) setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [uid]);

  async function toggle() {
    if (!uid || saving) return;
    setSaving(true);
    try {
      const next = !enabled;
      await setDoc(
        doc(db, `users/${uid}/settings/profile`),
        { fanEnabled: next, updatedAt: new Date() },
        { merge: true }
      );
      setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  if (!uid) return null;

  if (compact) {
    // small pill/button for topbar
    return (
      <button
        className="icon-btn"
        onClick={toggle}
        disabled={loading || saving}
        title={enabled ? "Fan Mode: ON" : "Fan Mode: OFF"}
        aria-pressed={enabled}
        aria-label="Enable Fan Mode"
      >
        <Icon name={enabled ? "heart" : "heart-outline"} />
      </button>
    );
  }

  // full-width setting row
  return (
    <label style={rowStyle}>
      <span>Enable Fan Mode</span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={toggle}
        disabled={loading || saving}
        aria-label="Enable Fan Mode"
      />
    </label>
  );
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  border: "1px solid #eee",
  borderRadius: 8,
  background: "#fff"
};
