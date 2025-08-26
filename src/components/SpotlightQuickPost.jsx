// src/components/SpotlightQuickPost.jsx
import React, { useState } from "react";
import { db, storage, auth } from "@/utils/init-firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useUserRole } from "@/hooks/useUserRole";

export default function SpotlightQuickPost() {
  const { isAdmin } = useUserRole();
  const [file, setFile] = useState(null);
  const [userName, setUserName] = useState("");
  const [quote, setQuote] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");

  if (!isAdmin) return null;

  async function submit(e) {
    e.preventDefault();
    if (!file || !userName) return;
    setBusy(true); setOk("");

    try {
      const key = `images/public/spotlights/${Date.now()}-${file.name}`;
      const r = ref(storage, key);
      await uploadBytes(r, file, { contentType: file.type });
      const imageUrl = await getDownloadURL(r);

      await addDoc(collection(db, "public/spotlights"), {
        userName, quote, imageUrl,
        featuredAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null
      });

      setUserName(""); setQuote(""); setFile(null);
      setOk("Posted! 🎉");
      setTimeout(()=>setOk(""), 1800);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="dashboard-card" style={{ padding: 12, display: "grid", gap: 8 }}>
      <strong>Quick Spotlight (admin)</strong>
      <input placeholder="Username" value={userName} onChange={e=>setUserName(e.target.value)} required />
      <input placeholder="Quote (optional)" value={quote} onChange={e=>setQuote(e.target.value)} />
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} required />
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn primary" type="submit" disabled={busy || !file || !userName}>
          {busy ? "Uploading…" : "Post Spotlight"}
        </button>
        {ok && <span className="muted">{ok}</span>}
      </div>
    </form>
  );
}
