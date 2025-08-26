import React from "react";

export default function ChallengesPage() {
  const challenges = [
    { id: 1, name: "Weekly Slay",    theme: "Monochrome Monday", ends: "6d" },
    { id: 2, name: "Festival Fits",  theme: "Denim & Sparkle",    ends: "12d" },
  ];

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card">
        <div className="card__body">
          <h2 className="card__title">Challenges</h2>
          <p className="muted">Join a prompt, post your look, and cheer each other on.</p>

          <div className="dashboard-grid">
            {challenges.map((c) => (
              <div key={c.id} className="dashboard-card">
                <div className="muted" style={{ fontSize: 12 }}>{c.name}</div>
                <h4 style={{ margin: "4px 0 6px" }}>{c.theme}</h4>
                <div className="pill">Ends in {c.ends}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="tb-btn primary" onClick={() => alert("TODO: join flow")}>Join</button>
                  <button className="tb-btn ghost" onClick={() => alert("TODO: see entries")}>See Entries</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
