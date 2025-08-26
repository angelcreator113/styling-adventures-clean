import React from "react";

export default function VipPage() {
  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card">
        <div className="card__body">
          <h2 className="card__title">VIP Closet Club</h2>
          <p className="muted">Early drops, styling mini-sessions, and exclusive challenges.</p>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h4>Perk: Early Access</h4>
              <p className="muted">See new looks and picks before anyone else.</p>
            </div>
            <div className="dashboard-card">
              <h4>Perk: AI Outfit Boosts</h4>
              <p className="muted">Get 3 smart suggestions per week for your closet.</p>
            </div>
            <div className="dashboard-card">
              <h4>Perk: VIP Challenges</h4>
              <p className="muted">Private prompts with surprise gifts 👀</p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="tb-btn primary" onClick={() => alert("TODO: upgrade flow")}>
              Upgrade to VIP
            </button>
            <span className="muted" aria-live="polite">Your status: Free</span>
          </div>
        </div>
      </div>
    </div>
  );
}
