// src/pages/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../components/topbar/Topbar.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

export default function Layout() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Topbar />
      <div className="app-shell">
        <aside id="sidebar" className="sidebar" />
        <main id="main-content" className="container" role="main">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </>
  );
}
