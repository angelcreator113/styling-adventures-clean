import React from "react";

export default function CardTip({ title = "Tip", body = "", className = "" }) {
  return (
    <div className={`dashboard-card ${className}`} aria-labelledby="tip-title">
      <h2 id="tip-title">💡 {title}</h2>
      <p className="muted">{body}</p>
    </div>
  );
}
