import React, { useEffect, useState } from "react";
import { useUploadPanel } from "@/hooks/useUploadPanel";
import { initSmartDropdownAll } from "@/components/smart-dropdown";
import "@/css/styles/upload-page.css";

export default function UploadEpisodePage() {
  // slug "episodes", but uiPrefix is singular "episode-"
  useUploadPanel("episodes", "episode-");
  useEffect(() => { initSmartDropdownAll({ panelId: "episode-panel" }); }, []);

  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="upload-page">
      <div className="upload-page-grid">
        <section id="episode-panel" className="card" aria-labelledby="ep-upload-title">
          <div className="card__body">
            <h2 id="ep-upload-title" className="card__title">Upload Episode</h2>
            <p className="muted">Drag & drop video, or click the area to choose a file.</p>

            <div id="episode-drop-area" className="drop-zone" role="button" tabIndex={0}>
              Choose a file…
            </div>
            <input id="episode-file-input" type="file" accept="video/*" hidden />

            <div id="episode-file-list" className="file-list" data-empty="true"></div>
            <progress id="episode-progress" max="100" value="0" hidden />
            <div id="episode-progress-label" className="muted"></div>

            <form id="episode-upload-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label htmlFor="episode-category">Category</label>
                <select id="episode-category" className="smart-dropdown" required />
              </div>
              <div className="form-group">
                <label htmlFor="episode-subcategory">Subcategory</label>
                <select id="episode-subcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="episode-subsubcategory">Sub-subcategory</label>
                <select id="episode-subsubcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="episode-title">Title (optional)</label>
                <input id="episode-title" type="text" />
              </div>

              {!showNotes ? (
                <button type="button" className="link" onClick={() => setShowNotes(true)}>
                  Add Notes
                </button>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="episode-notes">Notes (optional)</label>
                    <textarea id="episode-notes" rows={3} />
                  </div>
                  <button type="button" className="link" onClick={() => setShowNotes(false)}>
                    Hide Notes
                  </button>
                </>
              )}

              <label className="inline-flex items-center" style={{ gap: ".5rem", marginTop: 8 }}>
                <input id="episode-is-public" type="checkbox" /> Public
              </label>

              <div className="row" style={{ marginTop: 12 }}>
                <button id="episode-upload-btn" className="tb-btn primary" type="button">
                  Upload Episode
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="card dashboard" aria-labelledby="ep-dash-title">
          <div className="card__body">
            <h3 id="ep-dash-title" className="card__title">Episode Dashboard</h3>
            <div className="toolbar">
              <select id="episode-dash-filter" defaultValue="all"><option value="all">All Categories</option></select>
              <input id="episode-dash-search" placeholder="Search filenames…" />
            </div>
            <div id="episode-dashboard-root" className="dashboard-grid">
              <div className="empty">Items will appear here.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
