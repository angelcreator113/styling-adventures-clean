// src/components/topbar/AvatarMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";   // if you have it
import { logout } from "@/utils/auth-client";      // ← import once

export default function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { role } = useAuth?.() ?? { role: "fan" }; // optional role-based items

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  const doLogout = async () => {
    try {
      await logout();                   // clears cookie + Firebase auth
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="avatar-wrap menu-anchor" ref={ref}>
      <button
        className="avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        title="Account menu"
      >
        <Icon name="user" />
      </button>

      {open && (
        <div className="menu" role="menu">
          <Link to="/profile"  role="menuitem" className="menu-item">Profile</Link>
          <Link to="/settings" role="menuitem" className="menu-item">Settings</Link>
          <Link to="/billing"  role="menuitem" className="menu-item">Payments</Link>
          {/* Optional role-based shortcuts */}
          {role === "admin"   && <Link to="/admin"   role="menuitem" className="menu-item">Admin Console</Link>}
          {role === "creator" && <Link to="/creator" role="menuitem" className="menu-item">Creator Console</Link>}
          <a href="https://help.example.com" target="_blank" rel="noreferrer" role="menuitem" className="menu-item">Help</a>
          <div className="menu-sep" role="separator" />
          <button type="button" className="menu-item danger" role="menuitem" onClick={doLogout}>
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}

