import React, { useState } from "react";

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState({
    reminders: true,
    community: true,
    promos: false,
  });
  const toggle = (k) => () => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card">
        <div className="card__body">
          <h2 className="card__title">Notifications</h2>
          <p className="muted">Control what we ping you about.</p>

          <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr" }}>
            <label className="dashboard-card inline-flex" style={{ gap: 12, alignItems: "center" }}>
              <input type="checkbox" checked={prefs.reminders} onChange={toggle("reminders")} />
              Event reminders & outfit nudges
            </label>
            <label className="dashboard-card inline-flex" style={{ gap: 12, alignItems: "center" }}>
              <input type="checkbox" checked={prefs.community} onChange={toggle("community")} />
              Community replies & mentions
            </label>
            <label className="dashboard-card inline-flex" style={{ gap: 12, alignItems: "center" }}>
              <input type="checkbox" checked={prefs.promos} onChange={toggle("promos")} />
              New features + VIP promos
            </label>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="tb-btn primary" onClick={() => alert("Saved!")}>Save Preferences</button>
          </div>
        </div>
      </div>
    </div>
  );
}
