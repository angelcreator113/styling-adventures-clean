import React, { useState } from "react";

export default function OutfitBuilderPage() {
  const [lookName, setLookName] = useState("");
  const [slots, setSlots] = useState({
    top: null,
    bottom: null,
    shoes: null,
    extras: [],
  });

  // dumb demo drop handler – just captures the filename
  const makeDrop = (slot) => (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (slot === "extras") {
      setSlots((s) => ({ ...s, extras: [...s.extras, file.name] }));
    } else {
      setSlots((s) => ({ ...s, [slot]: file.name }));
    }
  };
  const allow = (e) => e.preventDefault();

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card">
        <div className="card__body">
          <h2 className="card__title">Build an Outfit</h2>
          <p className="muted">Drag & drop images from your device (or click a slot to choose).</p>

          <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(4, minmax(180px, 1fr))" }}>
            {["top","bottom","shoes"].map((slot) => (
              <div
                key={slot}
                className="drop-zone"
                onDrop={makeDrop(slot)}
                onDragOver={allow}
                onClick={() => alert("TODO: open file picker")}
                style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label={`Drop ${slot}`}
              >
                {slots[slot] ? <span>{slots[slot]}</span> : <span>{slot.toUpperCase()}</span>}
              </div>
            ))}
            <div
              className="drop-zone"
              onDrop={makeDrop("extras")}
              onDragOver={allow}
              onClick={() => alert("TODO: open file picker")}
              style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Drop extras"
            >
              {slots.extras.length ? `${slots.extras.length} extras` : "EXTRAS"}
            </div>
          </div>

          <form style={{ marginTop: 16 }} onSubmit={(e) => e.preventDefault()}>
            <label className="form-group" style={{ display: "block" }}>
              <span>Look name</span>
              <input
                value={lookName}
                onChange={(e) => setLookName(e.target.value)}
                placeholder="e.g. Brunch Pastels"
              />
            </label>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="tb-btn primary" type="submit">Save Look</button>
              <button className="tb-btn ghost" type="button" onClick={() => setSlots({ top:null,bottom:null,shoes:null,extras:[] })}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
