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

export default function AdminHome() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ margin: "8px 0 0" }}>Back Office</h1>

      {/* Content Files hub */}
      <section style={grid} aria-label="Content Files">
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Closet Upload</h3>
          <p>Upload wardrobe items (all categories supported).</p>
          <Link to="/admin/content/closet" className="btn">Open Closet Upload</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Full Episodes</h3>
          <p>Season/episode folders for finished shows.</p>
          <Link to="/admin/content/episodes" className="btn">Manage Episodes</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Unfinished Clips</h3>
          <p>Lala / Guest / Just A Woman → Seasons → Episodes.</p>
          <Link to="/admin/content/clips" className="btn">Manage Clips</Link>
        </div>
      </section>

      {/* Platform ops */}
      <section style={grid} aria-label="Platform">
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Panels / Meta</h3>
          <p>Configure homepage panels and global site metadata.</p>
          <Link to="/meta" className="btn">Open Panels</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Theme Library</h3>
          <p>Admin-managed templates for upload previews & branding.</p>
          <Link to="/admin/themes" className="btn">Open Theme Library</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Boards Analytics</h3>
          <p>Creator board engagement and sharing insights.</p>
          <Link to="/admin/boards" className="btn">Open Analytics</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Bestie Chat (manage)</h3>
          <p>Moderate threads, replies and reactions.</p>
          <Link to="/admin/chat" className="btn">Open Chat Admin</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Storage Smoke</h3>
          <p>Quick bucket health check & permissions sanity.</p>
          <Link to="/storage-smoke" className="btn">Run /smoke</Link>
        </div>
      </section>
    </div>
  );
}

