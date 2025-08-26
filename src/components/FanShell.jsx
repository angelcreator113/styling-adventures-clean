// src/components/FanShell.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Topbar from "@/components/topbar/Topbar.jsx";
import SidebarFan from "@/components/nav/SidebarFan.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import useFocusMainOnRouteChange from "@/hooks/useFocusMainOnRouteChange";

/**
 * FanShell
 * - Shared sticky Topbar
 * - Fan-only Sidebar with collapse toggle (persists per-session)
 * - Auto-focus #main-content when route changes
 */
export default function FanShell() {
  useFocusMainOnRouteChange();
  const loc = useLocation();

  // Persist sidebar collapsed state in sessionStorage so refresh keeps the state per tab.
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("fanSidebarCollapsed") === "1"
  );
  useEffect(() => {
    sessionStorage.setItem("fanSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="app-shell">
      {/* Topbar gets sticky via CSS class */}
      <Topbar className="app-topbar" rightAccessory={
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-pressed={collapsed}
          aria-controls="fan-sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          ☰ {collapsed ? "Open" : "Hide"}
        </button>
      } />

      <div className="app-shell__body">
        <aside
          id="fan-sidebar"
          className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
          aria-label="Fan navigation"
        >
          <SidebarFan collapsed={collapsed} currentPath={loc.pathname} />
        </aside>

        <main id="main-content" className="app-main" role="main" aria-live="polite">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
