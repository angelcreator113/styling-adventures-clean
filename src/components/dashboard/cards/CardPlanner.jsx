import React from "react";

export default function CardPlanner({ className = "" }) {
  return (
    <div className={`dashboard-card ${className}`} aria-labelledby="planner-title">
      <h2 id="planner-title">Planner 📅</h2>
      <p className="muted op-70">Plan looks for the week (coming soon).</p>
      <div className="panel-cta">
        <button className="btn" type="button" disabled title="Coming soon">
          Add plan
        </button>
      </div>
    </div>
  );
}
