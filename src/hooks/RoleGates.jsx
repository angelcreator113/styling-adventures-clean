// src/hooks/RoleGates.jsx
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getRoles, primaryRole, getCachedRoles } from "@/utils/roles";

const LS_KEY = "debug:roleOverride";

// local override helpers
export function getRoleOverride() {
  try { return localStorage.getItem(LS_KEY) || null; } catch { return null; }
}
export function setRoleOverride(role) {
  try { localStorage.setItem(LS_KEY, role); } catch {}
  window.dispatchEvent(new CustomEvent("role-override", { detail: role }));
}
export function clearRoleOverride() {
  try { localStorage.removeItem(LS_KEY); } catch {}
  window.dispatchEvent(new CustomEvent("role-override", { detail: null }));
}

export function useUserRole() {
  const [loading, setLoading] = useState(true);
  const [realRoles, setRealRoles] = useState(() => getCachedRoles().roles || ["fan"]);
  const [fanEnabled, setFanEnabled] = useState(false);

  // auth → roles
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setRealRoles(["fan"]);
        setFanEnabled(false);
        setLoading(false);
        return;
      }
      const roles = await getRoles();   // cached (no force refresh storms)
      setRealRoles(roles);
      setLoading(false);

      // best-effort watch (won’t affect admin options anymore)
      try {
        const pRef = doc(db, `users/${u.uid}/settings/profile`);
        return onSnapshot(pRef, (snap) => {
          setFanEnabled(!!(snap.data()?.fanEnabled));
        });
      } catch {
        setFanEnabled(false);
      }
    });
    return () => off && off();
  }, []);

  const real = primaryRole(realRoles);

  // OPTIONS:
  // Admin can always preview everything (admin/creator/fan).
  // Creator can preview creator + fan (if enabled).
  // Fan has no switcher.
  const roleOptions = useMemo(() => {
    if (real === "admin") return ["fan", "creator", "admin"];
    if (real === "creator") return fanEnabled ? ["fan", "creator"] : ["creator"];
    return [];
  }, [real, fanEnabled]);

  // effective role = local override if allowed, else real
  const [effectiveRole, setEffectiveRole] = useState(real);
  useEffect(() => {
    const apply = () => {
      const ov = getRoleOverride();
      setEffectiveRole(ov && roleOptions.includes(ov) ? ov : real);
    };
    apply();
    const h = () => apply();
    window.addEventListener("storage", h);
    window.addEventListener("role-override", h);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("role-override", h);
    };
  }, [real, roleOptions]);

  return {
    loading,
    role: real,
    isRealAdmin: real === "admin",
    effectiveRole,
    isAdmin: effectiveRole === "admin",
    isCreator: effectiveRole === "admin" || effectiveRole === "creator",
    fanEnabled,
    roleOptions,
    setRoleOverride,
    clearRoleOverride,
  };
}

