// src/components/AdminShell.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Topbar from "@/components/topbar/Topbar.jsx";
import SidebarAdmin from "@/components/nav/SidebarAdmin.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import useFocusMainOnRouteChange from "@/hooks/useFocusMainOnRouteChange";

// Optional: if you’re using the topbar role switcher, import and include it
// import RoleSwitcherTopbar from "@/components/topbar/RoleSwitcherTopbar.jsx";

export default function AdminShell() {
  // a11y: focus #main-content after route change
  useFocusMainOnRouteChange();

  const loc = useLocation();

  // Persist collapsed state per-tab so refresh keeps your choice
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("adminSidebarCollapsed") === "1"
  );
  useEffect(() => {
    sessionStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Memoize the Topbar accessory so it doesn’t re-render on every keystroke elsewhere
  const rightAccessory = useMemo(
    () => (
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed((v) => !v)}
        aria-pressed={collapsed}
        aria-controls="admin-sidebar"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {/* Keep this lightweight to avoid layout shifts in the topbar */}
        ☰ {collapsed ? "Open" : "Hide"}
      </button>
    ),
    [collapsed]
  );

  return (
    <div className="app-shell" /* stable outer frame */>
      {/* Topbar is eager (NOT lazy) to avoid frame flicker.
         rightAccessory is memoized to reduce reflows. */}
      <Topbar
        className="app-topbar"
        rightAccessory={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {rightAccessory}
            {/* Uncomment if you’re using the role switcher */}
            {/* <RoleSwitcherTopbar /> */}
          </div>
        }
      />

      {/* 2‑col body: fixed sidebar + flexible main
          IMPORTANT: No Suspense here — keep the frame stable. */}
      <div className="app-shell__body">
        {/* Sidebar is eager, with width controlled by CSS classes so the column
            never collapses while content loads (prevents flicker). */}
        <aside
          id="admin-sidebar"
          className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
          aria-label="Admin navigation"
        >
          <SidebarAdmin collapsed={collapsed} currentPath={loc.pathname} />
        </aside>

        {/* Only the page content (Outlet) is lazy/suspenseful. 
            This keeps Topbar + Sidebar rock-solid while chunks load. */}
        <main
          id="main-content"
          className="app-main"
          role="main"
          aria-live="polite"
          tabIndex={-1} // enables programmatic focus
        >
          <ErrorBoundary>
            <React.Suspense
              fallback={
                <section className="container" style={{ padding: 16 }}>
                  <div
                    className="dashboard-card"
                    role="status"
                    aria-live="polite"
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "2px solid #ccc",
                        borderTopColor: "#7c3aed",
                        animation: "spin .9s linear infinite",
                      }}
                    />
                    <span>Loading…</span>
                  </div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </section>
              }
            >
              <Outlet />
            </React.Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
