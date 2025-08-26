import React from "react";
import { Link } from "react-router-dom";

const card = {
  background: "var(--card-bg, #fff)",
  border: "1px solid rgba(0,0,0,.06)",
  borderRadius: 12,
  padding: 16,
};

const grid = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
};

export default function CreatorHome() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ margin: "8px 0 0" }}>Creator Studio</h1>

      {/* Files & planning */}
      <section style={grid} aria-label="Core">
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Content Files</h3>
          <p>Organize your own folders & items (Category → Subfolder → Item).</p>
          <Link to="/creator/files" className="btn">Open Content Files</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Content Calendar</h3>
          <p>Plan drops, shoots, collabs and posting cadence.</p>
          <Link to="/creator/calendar" className="btn">Open Calendar</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Creator Insights</h3>
          <p>Your boards performance and share analytics.</p>
          <Link to="/creator/insights" className="btn">Open Insights</Link>
        </div>
      </section>

      {/* Channels */}
      <section style={grid} aria-label="Channels">
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Pinterest</h3>
          <p>Prep pins and track ideas for future boards.</p>
          <Link to="/creator/pinterest" className="btn">Open Pinterest</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Instagram</h3>
          <p>Reels, carousels and story assets staging.</p>
          <Link to="/creator/instagram" className="btn">Open Instagram</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>YouTube</h3>
          <p>Ideas → scripts → rough cuts → publish.</p>
          <Link to="/creator/youtube" className="btn">Open YouTube</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Money Chat</h3>
          <p>Talk sponsorships, drops and monetization tips.</p>
          <Link to="/creator/money-chat" className="btn">Open Forum</Link>
        </div>
      </section>
    </div>
  );
}
