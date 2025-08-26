import React from "react";

export default function CalendarPage() {
  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card">
        <div className="card__body">
          <h2 className="card__title">My Calendar</h2>
          <p className="muted">See outfit events, challenges, and reminders in one place.</p>

          <div className="row" style={{ marginBottom: 12 }}>
            <button className="tb-btn secondary" onClick={() => alert("TODO: connect calendar")}>
              Connect Google / Apple Calendar
            </button>
          </div>

          <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(2,minmax(240px,1fr))" }}>
            <div className="dashboard-card">
              <div className="muted">Fri · 7:30 PM</div>
              <h4>Rooftop Mixer</h4>
              <div className="pill">Look: “Monochrome Mint”</div>
            </div>
            <div className="dashboard-card">
              <div className="muted">Tue · 6:00 PM</div>
              <h4>Gallery Opening</h4>
              <div className="pill">Look: “Soft Edge”</div>
            </div>
            <div className="empty">More events will appear here.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
