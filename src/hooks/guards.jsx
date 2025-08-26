// src/hooks/guards.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/RoleGates";

export function RequireAnyRole({ allow = [], children }) {
  const { loading, effectiveRole } = useUserRole();
  const loc = useLocation();

  if (loading) return null; // or spinner

  if (!allow.includes(effectiveRole)) {
    // Choose ONE of these patterns:

    // Pattern A: render an inline notice (prevents loop churn)
    return (
      <section className="container" style={{ padding: 16 }}>
        <div className="dashboard-card">
          <h2 style={{ marginTop: 0 }}>Unauthorized</h2>
          <p>You don’t have access to this page.</p>
        </div>
      </section>
    );

    // Pattern B: or do a single redirect
    // return <Navigate to="/unauthorized" replace state={{ from: loc.pathname }} />;
  }

  return children;
}

