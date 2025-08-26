import React from "react";

export default function DailyTip({ title = "Lala’s Daily Tip", body = "", className = "" }) {
  return (
    <div className={`dashboard-card ${className}`} aria-labelledby="daily-tip-title">
      <h2 id="daily-tip-title">💡 {title}</h2>
      <p className="muted">{body}</p>
    </div>
  );
}
