import React, { useEffect, useRef } from "react";
import AppShell from "../../components/AppShell";

import "../../css/styles.css";
import "../../css/theme.css";
import "../../css/sidebar.css";
import "../../css/panel.css";
import "../../css/forms-and-filters.css";
import "../../css/upload-form.css";

export default function ManagePanelsPage() {
  const nameRef = useRef(null);
  const typeRef = useRef(null);

  const handleAddPanel = (e) => {
    e.preventDefault();
    const panelName = nameRef.current?.value?.trim();
    const fileType = typeRef.current?.value || "image";
    if (!panelName) return;
    // TODO: wire to Firestore/your config
    console.log("Add Panel:", { panelName, fileType });
    nameRef.current.value = "";
  };

  useEffect(() => {
    // Any admin bootstrapping can go here.
  }, []);

  return (
    <AppShell pageTitle="Manage panels">
      <section className="panel-card">
        <header className="panel-header">
          <h1 className="page-title">Manage Upload Panels</h1>
        </header>
        <div className="panel-body">
          <form className="form-grid" onSubmit={handleAddPanel}>
            <label className="form-field">
              <span className="label">Panel Name</span>
              <input ref={nameRef} type="text" placeholder="e.g., Guest Uploads" />
            </label>
            <label className="form-field">
              <span className="label">Accepted File Types</span>
              <select ref={typeRef} defaultValue="image">
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">+ Add Panel</button>
            </div>
          </form>

          <div className="mt-6">
            <h2 className="section-title">Existing Panels</h2>
            <div className="muted">Admin tools will go here.</div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}