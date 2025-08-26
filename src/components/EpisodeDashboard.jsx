// src/components/EpisodeDashboard.jsx
import React from 'react';

export default function EpisodeDashboard() {
  return (
    <div className="dashboard-section">
      <h2>🎬 Episode Dashboard</h2>
      <p>This will display uploaded episode files and metadata.</p>

      {/* You can add filtering, sorting, and previews here later */}
      <div className="dashboard-placeholder">
        No episodes uploaded yet. Upload one to get started!
      </div>
    </div>
  );
}
