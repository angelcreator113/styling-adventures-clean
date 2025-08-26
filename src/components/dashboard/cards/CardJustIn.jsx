// src/components/dashboard/cards/CardJustIn.jsx
import React from "react";
import JustInCarousel from "@/features/closet/JustInCarousel.jsx";

export default function CardJustIn({ className = "", limit = 12 }) {
  return (
    <section className={`card ${className}`} aria-labelledby="just-in-title">
      <h2 id="just-in-title" className="section-title">Just In 🧾</h2>
      <JustInCarousel limit={limit} />
      {/* Optional footer CTA:
      <div style={{ marginTop: 10 }}>
        <a className="tb-btn" href="/closet" onClick={(e)=>{e.preventDefault(); window.__nav ? __nav('/closet') : (location.href='/closet')}}>
          See all
        </a>
      </div>
      */}
    </section>
  );
}

