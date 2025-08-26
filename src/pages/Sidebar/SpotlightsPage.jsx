import React from "react";

export default function SpotlightsPage() {
  const sample = [
    { name: "Jae",   caption: "Monochrome magic",  city: "Brooklyn" },
    { name: "Mara",  caption: "Rom-com core",      city: "Atlanta" },
    { name: "Tess",  caption: "Festival sparkle",  city: "Austin"  },
    { name: "Omar",  caption: "Street-tailored",   city: "LA"      },
  ];

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card">
        <div className="card__body">
          <h2 className="card__title">Fan Spotlights</h2>
          <p className="muted">Community looks we’re obsessing over ✨</p>

          <div className="dashboard-grid">
            {sample.map((s, i) => (
              <article key={i} className="dashboard-card">
                <div className="muted" style={{ fontSize: 12 }}>{s.city}</div>
                <h4 style={{ margin: "4px 0 8px" }}>{s.name}</h4>
                <div className="pill">#{s.caption.replace(/\s+/g,"")}</div>
              </article>
            ))}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="tb-btn primary" onClick={() => alert("TODO: open submit flow")}>
              Submit Your Look
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
