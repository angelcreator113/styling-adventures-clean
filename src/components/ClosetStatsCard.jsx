import React, { useEffect } from "react";
import { loadStats } from "@/components/stats.js";

/**
 * Small wrapper that renders a stats grid and lets loadStats()
 * populate it when the user is signed in.
 */
export default function ClosetStatsCard() {
  useEffect(() => {
    // will fill #closet-stats with totals when auth/db are available
    loadStats();
  }, []);

  return (
    <div id="closet-stats" className="kpis">
      {/* sensible placeholders so UI doesn't jump */}
      <div className="kpi">
        <div className="label">Total Pieces</div>
        <div className="value">0</div>
      </div>
      <div className="kpi">
        <div className="label">Categories</div>
        <div className="value">0</div>
      </div>
      <div className="kpi">
        <div className="label">Recent Uploads</div>
        <div className="value">0</div>
      </div>
    </div>
  );
}
