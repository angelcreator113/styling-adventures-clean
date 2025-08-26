// src/components/TipsBanner.jsx
import React from "react";

export default function TipsBanner({ storageKey = "spaces_tips_dismissed" }) {
  const [open, setOpen] = React.useState(() => localStorage.getItem(storageKey) !== "1");
  if (!open) return null;
  return (
    <div className="dashboard-card" style={{padding:16, marginBottom:12}}>
      <strong>What are Spaces?</strong>
      <p style={{margin:"6px 0 0"}}>
        Spaces are your personal content buckets. Use one per campaign, theme, or project
        so uploads stay organized and stress-free.
      </p>
      <ul style={{margin:"8px 0 0", paddingLeft: "1.2rem"}}>
        <li>✨ Stay organized — no more mixing projects</li>
        <li>📂 Two Spaces included (upgrade later)</li>
        <li>🖼 Visual dashboard with thumbnails</li>
        <li>🚀 Grows with you</li>
      </ul>
      <div style={{marginTop:8}}>
        <label style={{display:"inline-flex", gap:8, alignItems:"center"}}>
          <input type="checkbox" onChange={(e)=>{ if(e.target.checked){ localStorage.setItem(storageKey,"1"); setOpen(false); }}}/>
          Don’t show again
        </label>
      </div>
    </div>
  );
}
