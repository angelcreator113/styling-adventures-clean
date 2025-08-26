import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function QuickActionsMenu({ primary }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        className="tb-btn primary hide-sm-on-very-small"
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Quick actions"
      >
        + New
      </button>
      {open && (
        <div className="menu" role="menu" style={{ minWidth: 200 }}>
          <Link to="/closet"   role="menuitem" className="menu-item">Upload Closet Item</Link>
          <Link to="/episodes" role="menuitem" className="menu-item">New Episode</Link>
          <Link to="/voice"    role="menuitem" className="menu-item">New Voice Clip</Link>
          <div className="menu-sep" role="separator" />
          <button type="button" className="menu-item" role="menuitem" onClick={primary.onClick}>
            {primary.label}
          </button>
        </div>
      )}
    </div>
  );
}
