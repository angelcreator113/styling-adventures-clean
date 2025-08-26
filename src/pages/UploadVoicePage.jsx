import React, { useEffect, useState } from "react";
import { useUploadPanel } from "@/hooks/useUploadPanel";
import { initSmartDropdownAll } from "@/components/smart-dropdown";
import "@/css/styles/upload-page.css";

export default function UploadVoicePage() {
  useUploadPanel("voice", "voice-");
  useEffect(() => { initSmartDropdownAll({ panelId: "voice-panel" }); }, []);

  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="upload-page">
      <div className="upload-page-grid">
        <section id="voice-panel" className="card" aria-labelledby="voice-upload-title">
          <div className="card__body">
            <h2 id="voice-upload-title" className="card__title">Upload Voice</h2>
            <p className="muted">Drag & drop audio, or click the area to choose a file.</p>

            <div id="voice-drop-area" className="drop-zone" role="button" tabIndex={0}>
              Choose a file…
            </div>
            <input id="voice-file-input" type="file" accept="audio/*" hidden />

            <div id="voice-file-list" className="file-list" data-empty="true"></div>
            <progress id="voice-progress" max="100" value="0" hidden />
            <div id="voice-progress-label" className="muted"></div>

            <form id="voice-upload-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label htmlFor="voice-category">Category</label>
                <select id="voice-category" className="smart-dropdown" required />
              </div>
              <div className="form-group">
                <label htmlFor="voice-subcategory">Subcategory</label>
                <select id="voice-subcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="voice-subsubcategory">Sub-subcategory</label>
                <select id="voice-subsubcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="voice-title">Title (optional)</label>
                <input id="voice-title" type="text" />
              </div>

              {!showNotes ? (
                <button type="button" className="link" onClick={() => setShowNotes(true)}>
                  Add Notes
                </button>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="voice-notes">Notes (optional)</label>
                    <textarea id="voice-notes" rows={3} />
                  </div>
                  <button type="button" className="link" onClick={() => setShowNotes(false)}>
                    Hide Notes
                  </button>
                </>
              )}

              <label className="inline-flex items-center" style={{ gap: ".5rem", marginTop: 8 }}>
                <input id="voice-is-public" type="checkbox" /> Public
              </label>

              <div className="row" style={{ marginTop: 12 }}>
                <button id="voice-upload-btn" className="tb-btn primary" type="button">
                  Upload Voice
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="card dashboard" aria-labelledby="voice-dash-title">
          <div className="card__body">
            <h3 id="voice-dash-title" className="card__title">Voice Dashboard</h3>
            <div className="toolbar">
              <select id="voice-dash-filter" defaultValue="all"><option value="all">All Categories</option></select>
              <input id="voice-dash-search" placeholder="Search filenames..." />
            </div>
            <div id="voice-dashboard-root" className="dashboard-grid">
              <div className="empty">Items will appear here.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
