import React, { useEffect } from "react";
import AppShell from "@/components/AppShell.jsx";
import styles from "@/css/UploadClosetPage.module.css";

export default function ClosetUploadPage() {
  useEffect(() => {
    import("./closet-upload.js")
      .then(m => m.setupClosetUploadUI?.())
      .catch(e => console.warn("[closet] init skipped:", e));
  }, []);

  return (
    <AppShell pageTitle="Closet">
      <section className={styles.card} aria-labelledby="closet-upload-title" role="region">
        <header className={styles.header}>
          <h1 id="closet-upload-title" className={styles.title}>Upload / Closet</h1>
        </header>
        <section id="upload-sections" className={styles.uploadSections} />
        <section id="dashboard-sections" className={styles.dashboardSections} />
      </section>
    </AppShell>
  );
}
