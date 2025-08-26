import React from "react";

export default function CardCollections({ collections = [] }) {
  return (
    <div className="dashboard-card" aria-labelledby="collections-title">
      <h2 id="collections-title">Collections 🗂️</h2>
      {collections.length === 0 ? (
        <p className="muted op-70">No collections yet.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: "1rem" }}>
          {collections.map(c => (
            <li key={c.id}>
              <strong>{c.name}</strong> — {c.count} items
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
