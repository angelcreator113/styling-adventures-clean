// src/hooks/useEffectiveRole.js
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Effective role helper:
 * - If you're admin, you can "view as" fan/creator/admin.
 * - Non-admin users always return their own primary role.
 * - Persists to sessionStorage so it resets per-tab (less surprising).
 */
const KEY = "viewAsRole";

export function useEffectiveRole() {
  const { role: primaryRole } = useAuth();
  const [viewAs, setViewAs] = useState(() => sessionStorage.getItem(KEY) || "");

  // Keep session storage synced
  useEffect(() => {
    if (viewAs) sessionStorage.setItem(KEY, viewAs);
    else sessionStorage.removeItem(KEY);
    // broadcast a custom event so other parts can react if needed
    window.dispatchEvent(new CustomEvent("role:viewas", { detail: { viewAs } }));
  }, [viewAs]);

  // Admin may override; others cannot
  const effectiveRole = useMemo(() => {
    if (primaryRole === "admin" && viewAs) return viewAs;
    return primaryRole || "guest";
  }, [primaryRole, viewAs]);

  return { effectiveRole, primaryRole, viewAs, setViewAs };
}
