// src/pages/ClosetDashboardPage.jsx
import React from "react";
import PanelTabs from "@/components/PanelTabs.jsx";
import ClosetDashboard from "@/components/ClosetDashboard.jsx";

export default function ClosetDashboardPage() {
  return (
    <main className="container" style={{ padding: "12px 16px" }}>
      <PanelTabs base="/closet" />
      <section className="panel panel-card">
        <h1 className="text-xl font-semibold mb-4">Closet Dashboard</h1>
        <ClosetDashboard />
      </section>
    </main>
  );
}
