// src/pages/UploadClosetPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { initSmartDropdownAll } from "@/components/smart-dropdown";
import ClosetDashboard from "@/components/ClosetDashboard.jsx";
import BestieToolboxPanel from "@/components/BestieToolboxPanel.jsx";
import CameraOverlay from "@/components/CameraOverlay.jsx";
import { initUploadPanel } from "@/hooks/useUploadPanel";
import "@/css/styles/upload-page.css";

export default function UploadClosetPage() {
  const [showNotes, setShowNotes] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const ingestRef = useRef(null);

  useEffect(() => {
    const { ingest } = initUploadPanel("closet", "closet-");
    ingestRef.current = ingest;
    initSmartDropdownAll({ panelId: "closet-panel" });
  }, []);

  return (
    <div className="upload-page">
      <div className="upload-page-grid v2">
        {/* UPLOAD (left) */}
        <section id="closet-panel" className="card up-card" aria-labelledby="closet-upload-title">
          <div className="card__body">
            <h2 id="closet-upload-title" className="card__title">Closet Upload</h2>
            <p className="muted">Drag & drop an image, click to choose a file, or use your camera.</p>

            <div
              id="closet-drop-area"
              className="drop-zone"
              role="button"
              tabIndex={0}
              onClick={() => document.getElementById("closet-file-input")?.click()}
            >
              Choose a file…
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button id="closet-camera-btn" className="tb-btn" type="button" onClick={() => setCamOpen(true)}>
                Use Camera
              </button>
            </div>

            <input id="closet-file-input" type="file" accept="image/*" capture="environment" hidden />

            {/* Progress + list */}
            <div id="closet-file-list" className="file-list" data-empty="true" />
            <progress id="closet-progress" max="100" value="0" hidden />
            <div id="closet-progress-label" className="muted" />

            {/* Form */}
            <form id="closet-upload-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label htmlFor="closet-category">Category</label>
                <select id="closet-category" className="smart-dropdown" required />
              </div>
              <div className="form-group">
                <label htmlFor="closet-subcategory">Subcategory</label>
                <select id="closet-subcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="closet-subsubcategory">Sub-subcategory</label>
                <select id="closet-subsubcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="closet-title">Title (optional)</label>
                <input id="closet-title" type="text" />
              </div>

              {!showNotes ? (
                <button type="button" className="link" onClick={() => setShowNotes(true)}>Add Notes</button>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="closet-notes">Notes (optional)</label>
                    <textarea id="closet-notes" rows={3} />
                  </div>
                  <button type="button" className="link" onClick={() => setShowNotes(false)}>Hide Notes</button>
                </>
              )}

              <div className="row" style={{ marginTop: 12 }}>
                <button id="closet-upload-btn" className="tb-btn primary" type="button">
                  Upload to Closet
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* DASHBOARD (right) */}
        <section className="card dash-card">
          <div className="card__body">
            <h2 className="card__title">Closet Dashboard</h2>
            <ClosetDashboard />
          </div>
        </section>

        {/* TOOLBOX (full width under) */}
        <section className="card toolbox-card">
          <BestieToolboxPanel uiPrefix="closet-" />
        </section>
      </div>

      {/* Camera overlay */}
      <CameraOverlay
        open={camOpen}
        onClose={() => setCamOpen(false)}
        onCapture={(blob) => ingestRef.current?.(blob)}
      />
    </div>
  );
}
