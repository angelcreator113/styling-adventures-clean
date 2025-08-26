// src/components/dashboard/cards/CardStats.jsx
import React from "react";

export default function CardStats({ totals, onAddFirst, className = "" }) {
  const { pieces = 0, categories = 0, recentUploads = 0 } = totals || {};

  return (
    <div className={`dashboard-card ${className}`} aria-labelledby="closet-stats-title">
      <h2 id="closet-stats-title">Closet Stats 📊</h2>

      <div className="stats-grid" role="group" aria-label="Closet Statistics">
        <div className="stat-block">
          <span className="stat-label">Total Pieces</span>
          <span className="stat-value">{pieces}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{categories}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Recent Uploads</span>
          <span className="stat-value">{recentUploads}</span>
        </div>
      </div>

      <div className="panel-cta">
        <button className="btn" type="button" onClick={onAddFirst}>
          + Add your first item
        </button>
      </div>
    </div>
  );
}

