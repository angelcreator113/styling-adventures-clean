// src/pages/HomeSwitcher.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

// Uses your role logic (claims + local "view as" override + fanEnabled)
import { useUserRole } from "@/hooks/RoleGates.jsx";

// Fan landing (we render it directly so /home is a real page for fans)
import FanHome from "@/pages/home/FanHome.jsx";

/**
 * HomeSwitcher
 * - Decides what to show at /home based on effectiveRole.
 * - Fans: render FanHome here (keeps nice URL).
 * - Creators/Admins: redirect to their dedicated homes to keep breadcrumbs clean.
 * - Includes a tiny loading shim + loop guards to avoid flicker.
 */
export default function HomeSwitcher() {
  const { loading, effectiveRole } = useUserRole();
  const loc = useLocation();

  // ---- tiny, non-janky loading card (same style as your Fallback spinner) ----
  if (loading) {
    return (
      <section className="container" style={{ padding: 16 }}>
        <div
          className="dashboard-card"
          role="status"
          aria-live="polite"
          style={{ display: "flex", gap: 12, alignItems: "center", padding: 12 }}
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
    );
  }

  // ---- Where should each role land? Keep it centralized for clarity. ----
  const targets = useMemo(
    () => ({
      admin: "/admin/home",
      creator: "/creator/home",
      fan: "/home", // fan stays here; we render <FanHome/>
    }),
    []
  );

  // ---- Compute the area for the current path (prevents loops/flicker) ----
  const areaOf = (path) => {
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/creator")) return "creator";
    return "fan"; // default treat /, /home, etc. as fan area
  };

  // ---- Prevent rapid redirect loops on fast role switches ----
  const lastNavRef = useRef({ path: "", ts: 0 });

  // If the user is creator/admin but already in the right area, we don't redirect.
  if (effectiveRole === "admin") {
    const target = targets.admin;
    if (areaOf(loc.pathname) !== "admin") {
      const now = Date.now();
      if (lastNavRef.current.path !== target || now - lastNavRef.current.ts > 300) {
        lastNavRef.current = { path: target, ts: now };
        return <Navigate to={target} replace />;
      }
    }
    // Already in /admin… Let nested admin routes render (rare when visiting /home directly)
    return <Navigate to={target} replace />;
  }

  if (effectiveRole === "creator") {
    const target = targets.creator;
    if (areaOf(loc.pathname) !== "creator") {
      const now = Date.now();
      if (lastNavRef.current.path !== target || now - lastNavRef.current.ts > 300) {
        lastNavRef.current = { path: target, ts: now };
        return <Navigate to={target} replace />;
      }
    }
    return <Navigate to={target} replace />;
  }

  // Fans: render the actual Fan home (keeps /home as a real page).
  return <FanHome />;
}
