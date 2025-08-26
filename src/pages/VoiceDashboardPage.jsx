// src/pages/VoiceDashboardPage.jsx
import React from "react";
import PanelTabs from "@/components/PanelTabs.jsx";
import VoiceDashboard from "@/components/VoiceDashboard.jsx";

export default function VoiceDashboardPage() {
  return (
    <main className="container" style={{ padding: "12px 16px" }}>
      <PanelTabs base="/voice" />
      <section className="panel panel-card">
        <h1 className="text-xl font-semibold mb-4">Voice Dashboard</h1>
        <VoiceDashboard />
      </section>
    </main>
  );
}
