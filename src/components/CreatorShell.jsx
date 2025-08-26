import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Topbar from "@/components/topbar/Topbar.jsx";                // ✅ "@/"
import SidebarCreator from "@/components/nav/SidebarCreator.jsx";    // ✅ "@/"
import ErrorBoundary from "@/components/ErrorBoundary.jsx";          // ✅ "@/"
import useFocusMainOnRouteChange from "@/hooks/useFocusMainOnRouteChange"; // ✅ "@/"

export default function CreatorShell() {
  useFocusMainOnRouteChange();
  const loc = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("creatorSidebarCollapsed") === "1"
  );
  useEffect(() => {
    sessionStorage.setItem("creatorSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="app-shell">
      <Topbar className="app-topbar" rightAccessory={
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-pressed={collapsed}
          aria-controls="creator-sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          ☰ {collapsed ? "Open" : "Hide"}
        </button>
      } />

      <div className="app-shell__body">
        <aside
          id="creator-sidebar"
          className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
          aria-label="Creator navigation"
        >
          <SidebarCreator collapsed={collapsed} currentPath={loc.pathname} />
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
