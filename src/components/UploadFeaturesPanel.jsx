import React from "react";

/**
 * UploadFeaturesPanel
 * - Defaults: Trim BG ✅, Smart compress ✅, Auto name ✅
 * - Optional: Pad to square
 * - Make Public lives here
 * - NEW: Pro background remover (server) toggle -> id `${uiPrefix}feat-server`
 */
export default function UploadFeaturesPanel({ uiPrefix = "" }) {
  return (
    <div className="tool-panel">
      <div className="tool-row">
        <label className="tool-check">
          <input id={`${uiPrefix}feat-compress`} type="checkbox" defaultChecked />
          <span className="tool-title">Smart compress</span>
          <span className="tool-sub">Downscale big photos for faster uploads.</span>
        </label>
      </div>

      <div className="tool-row">
        <label className="tool-check">
          <input id={`${uiPrefix}feat-trim`} type="checkbox" defaultChecked />
          <span className="tool-title">Trim plain background</span>
          <span className="tool-sub">Auto-make white/solid edges transparent.</span>
        </label>
      </div>

      {/* NEW: Pro server remover */}
      <div className="tool-row">
        <label className="tool-check">
          <input id={`${uiPrefix}feat-server`} type="checkbox" />
          <span className="tool-title">Pro background remover (server)</span>
          <span className="tool-sub">
            Use Cloud Function for tricky photos (patterns/shadows). Falls back to quick trim.
          </span>
        </label>
      </div>

      <div className="tool-row">
        <label className="tool-check">
          <input id={`${uiPrefix}feat-pad`} type="checkbox" />
          <span className="tool-title">Pad to square</span>
          <span className="tool-sub">Great for uniform thumbnails.</span>
        </label>
      </div>

      <div className="tool-row">
        <label className="tool-check">
          <input id={`${uiPrefix}feat-autoname`} type="checkbox" defaultChecked />
          <span className="tool-title">Auto name</span>
          <span className="tool-sub">Suggest a cleaner title from the filename.</span>
        </label>
      </div>

      <div className="tool-row">
        <label className="tool-check">
          <input id={`${uiPrefix}feat-public`} type="checkbox" defaultChecked />
          <span className="tool-title">Make Public</span>
          <span className="tool-sub">Share in your community & looks.</span>
        </label>
      </div>
    </div>
  );
}
