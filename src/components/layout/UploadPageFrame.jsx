import React from "react";

/**
 * Two-column upload layout:
 *  - Left: drop area + form (IDs are derived from `slug`)
 *  - Right: dashboard stub (filters + empty grid container you can fill later)
 *
 * Keep IDs exactly as your hooks/utilities expect:
 *  - #{slug}-drop-area  | #{slug}-file-input | #{slug}-upload-form | #{slug}-upload-btn
 *  - #{slug}-category   | #{slug}-subcategory | #{slug}-subsubcategory
 *  - #{slug}-grid (dashboard)
 */
export default function UploadPageFrame({ slug, title, accept = "*" }) {
  return (
    <section className="upload-page">
      <header className="upload-head">
        <h1 className="upload-title">{title}</h1>
        <nav className="upload-subtabs">
          <a className="subtab active">Upload</a>
          <span className="sep">•</span>
          <a className="subtab">Dashboard</a>
        </nav>
      </header>

      <div className="upload-two-col">
        {/* LEFT: Upload card */}
        <section className="card upload-card">
          <div id={`${slug}-drop-area`} className="drop-area" data-panel={slug} role="button" tabIndex={0}>
            <div className="drop-icon" aria-hidden>＋</div>
            <p className="drop-text">Choose a file…</p>
            <input id={`${slug}-file-input`} type="file" accept={accept} hidden />
          </div>

          <form id={`${slug}-upload-form`} className="upload-form" noValidate>
            <label className="form-row">
              <span>Category</span>
              <select id={`${slug}-category`} className="smart-dropdown" required>
                <option value="">Select</option>
              </select>
            </label>

            <label className="form-row">
              <span>Subcategory</span>
              <select id={`${slug}-subcategory`} className="smart-dropdown">
                <option value="">Select</option>
              </select>
            </label>

            <label className="form-row">
              <span>Sub-subcategory</span>
              <select id={`${slug}-subsubcategory`} className="smart-dropdown">
                <option value="">Select</option>
              </select>
            </label>

            <label className="form-row">
              <span>Title (optional)</span>
              <input id={`${slug}-title`} type="text" placeholder="" />
            </label>

            <label className="form-row">
              <span>Notes (optional)</span>
              <textarea id={`${slug}-notes`} rows={3} />
            </label>

            <label className="form-row inline">
              <input id={`${slug}-is-public`} type="checkbox" defaultChecked />
              <span>Make Public</span>
            </label>

            <div className="form-actions">
              <button type="button" id={`${slug}-upload-btn`} className="btn primary full">
                Upload
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT: Dashboard card (stub for now) */}
        <section className="card dash-card">
          <h3 className="card-title">{title} Dashboard</h3>

          <div className="dash-toolbar">
            <select id={`${slug}-dash-filter`} className="pill">
              <option>All Categories</option>
            </select>
            <input id={`${slug}-dash-search`} className="pill" type="search" placeholder="Search filenames…" />
            <select id={`${slug}-dash-sort`} className="pill">
              <option>Sort by Name</option>
              <option>Newest</option>
              <option>Oldest</option>
            </select>
          </div>

          <div id={`${slug}-grid`} className="item-grid">
            {/* cards get rendered here (future step) */}
          </div>
        </section>
      </div>
    </section>
  );
}
