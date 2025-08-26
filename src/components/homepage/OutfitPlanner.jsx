// src/components/homepage/OutfitPlanner.jsx
import React, { useEffect } from "react";
import { generateOutfit } from "@/components/homepage/outfit";

export default function OutfitPlanner({
  className = "",
  autogenerate = false,          // <- choose if it runs on mount
  fit = "contain",               // "contain" | "cover" | "cover-left"
}) {
  useEffect(() => {
    if (autogenerate) generateOutfit("#outfit-display"); // renders into the square box
  }, [autogenerate]);

  const fitClass =
    fit === "contain" ? "fit-contain" :
    fit === "cover-left" ? "pos-left" : "";

  return (
    <article className={`tile-planner card ${className}`} aria-labelledby="h-plan">
      <div className="media">
        {/* square box target */}
        <div id="outfit-display" className={`thumb thumb--square ${fitClass}`} aria-live="polite">
          {/* placeholder only; generateOutfit() will replace this */}
          <img src="/images/closet-planner.jpg" alt="" loading="lazy" />
        </div>
      </div>

      <div className="content">
        <h2 id="h-plan" className="section-title">Outfit Planner</h2>
        <p>Build tomorrow’s look in seconds, or spin up a capsule.</p>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="tb-btn" onClick={() => generateOutfit("#outfit-display")}>
            Generate Look
          </button>
        </div>
      </div>
    </article>
  );
}
