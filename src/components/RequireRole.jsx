// src/components/RequireRole.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";

/**
 * Role-based route protection:
 * - Matches against effectiveRole (admin may "view as" creator/fan)
 * - Admin (without view-as) always allowed
 */
export default function RequireRole({ role, children }) {
  const { loading, role: primaryRole } = useAuth();
  const { effectiveRole } = useEffectiveRole();
  const location = useLocation();

  if (loading) return null;

  const allowedRoles = Array.isArray(role) ? role : [role];
  const adminBypass = primaryRole === "admin" && !sessionStorage.getItem("viewAsRole");

  const isAllowed =
    adminBypass ||                             // admin not viewing-as gets full access
    allowedRoles.includes(effectiveRole);      // otherwise check effective

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }
  return children;
}
