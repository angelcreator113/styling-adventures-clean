// src/pages/EpisodeDashboardPage.jsx
import React from "react";
import PanelTabs from "@/components/PanelTabs.jsx";
import EpisodeDashboard from "@/components/EpisodeDashboard.jsx";

export default function EpisodeDashboardPage() {
  return (
    <main className="container" style={{ padding: "12px 16px" }}>
      <PanelTabs base="/episodes" />
      <section className="panel panel-card">
        <h1 className="text-xl font-semibold mb-4">Episodes Dashboard</h1>
        <EpisodeDashboard />
      </section>
    </main>
  );
}
