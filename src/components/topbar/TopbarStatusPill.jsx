import React from "react";

export default function TopbarStatusPill({ status, pct }) {
  if (!status) return null;
  return (
    <div className="status-pill" aria-live="polite">
      <span className="status-dot" />
      <span className="status-text">{status}</span>
      {pct !== null && (
        <span className="status-track" aria-hidden="true">
          <span className="status-bar" style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  );
}
