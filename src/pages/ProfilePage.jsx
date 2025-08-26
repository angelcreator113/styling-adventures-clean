// src/pages/ProfilePage.jsx
import React, { useEffect, useRef, useState } from "react";
import "../css/profile.css";
import { readGreetingName, saveGreetingName } from "../js/greeting-store.js";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setName(readGreetingName());
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  function handleSave() {
    const next = (name || "").trim() || "Bestie";
    saveGreetingName(next);

    // live-update sidebar if it’s present in the shell
    const greetEl = document.getElementById("sidebar-greeting");
    if (greetEl) greetEl.textContent = `Bestie, ${next}, Welcome Back!`;

    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  return (
    <div className="main-content">
      <section className="profile-wrap">
        <header className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-sub">Make it yours—set your greeting ✨</p>
        </header>

        <div className="profile-grid">
          <section className="card">
            <h2 className="card-title">Greeting</h2>
            <div className="field">
              <label htmlFor="greetName">Greeting name</label>
              <input
                id="greetName"
                ref={inputRef}
                type="text"
                placeholder="Bestie"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-describedby="greetHelp"
              />
              <small id="greetHelp" className="muted">
                Used in the sidebar: <em>“Bestie, {name || "Bestie"}, Welcome Back!”</em>
              </small>
            </div>

            <div className="action-row">
              <button type="button" className="btn primary" onClick={handleSave}>
                Save Greeting
              </button>
              {saved && <span className="save-badge" role="status">Saved ✔</span>}
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Account</h2>
            <p className="muted">More profile settings coming soon.</p>
          </section>
        </div>
      </section>
    </div>
  );
}
