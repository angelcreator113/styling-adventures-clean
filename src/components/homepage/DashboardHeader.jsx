import React from "react";

export default function DashboardHeader({
  greeting,
  closetTotal = 0,
  outfitsSaved = 0,
  lastUpload = "–",
  previewSrc = "/images/closet-preview.png", // ✅ fixed path
  onStyle,
}) {
  return (
    <div className="dashboard-header">
      <div className="intro">
        <h2>{greeting || "👋 Hey Friend, welcome back!"}</h2>
        <p>
          Closet Total: <span id="closet-total">{closetTotal}</span>
        </p>
        <p>
          Outfits Saved: <span id="outfits-saved">{outfitsSaved}</span>
        </p>
        <p>
          Last Upload: <span id="last-upload">{lastUpload}</span>
        </p>
      </div>

      <div className="style-card">
        <img
          className="style-preview" // ✅ added class
          src={previewSrc}
          alt="Closet preview"
          loading="lazy"
        />
        <button id="style-button" type="button" onClick={onStyle}>
          ✨ Style Me, Bestie
        </button>
      </div>
    </div>
  );
}
