// src/hooks/useUserRole.js
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const LS_KEY = "debug:roleOverride";

/** client-only override for “view as …” */
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

  // Real auth-based role/claims (from custom claims)
  const [realRole, setRealRole] = useState("fan");
  const [claims, setClaims] = useState(null);
  const isRealAdmin = realRole === "admin";

  // Eligibility flag: has the user “signed up as a fan”?
  // We watch users/{uid}/settings/profile { fanEnabled: boolean }
  const [fanEnabled, setFanEnabled] = useState(false);

  // Effective role is what the UI uses (switcher may override, with constraints).
  const [effectiveRole, setEffectiveRole] = useState("fan");

  // ---- listen to auth + claims
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setRealRole("fan");
        setClaims(null);
        setFanEnabled(false);
        setEffectiveRole("fan");
        setLoading(false);
        return;
      }
      try {
        const res = await getIdTokenResult(u, true);
        const roleClaim = res.claims.role || (res.claims.admin ? "admin" : "fan");
        setRealRole(roleClaim);
        setClaims(res.claims);

        // Watch fan eligibility doc
        const pRef = doc(db, `users/${u.uid}/settings/profile`);
        const unsub = onSnapshot(
          pRef,
          (snap) => {
            const data = snap.data() || {};
            // default false: creators only see Fan if explicitly enabled
            setFanEnabled(!!data.fanEnabled);
          },
          () => setFanEnabled(false)
        );
        return () => unsub();
      } catch {
        setRealRole("fan");
      } finally {
        setLoading(false);
      }
    });
    return off;
  }, []);

  // ---- compute allowed options & effectiveRole
  const options = useMemo(() => {
    // What can the switcher show?
    // - Admin: can preview Admin + Creator; Fan only if fanEnabled true
    // - Creator: can preview Creator; Fan only if fanEnabled true
    // - Fan: no switcher
    if (realRole === "admin") {
      return fanEnabled ? ["fan", "creator", "admin"] : ["creator", "admin"];
    }
    if (realRole === "creator") {
      return fanEnabled ? ["fan", "creator"] : ["creator"];
    }
    return []; // fan
  }, [realRole, fanEnabled]);

  useEffect(() => {
    // Pick an effective role:
    // 1) if override exists AND is allowed by options -> use it
    // 2) otherwise use the realRole
    const ov = getRoleOverride();
    if (ov && options.includes(ov)) {
      setEffectiveRole(ov);
    } else {
      setEffectiveRole(realRole);
    }
  }, [realRole, options]);

  useEffect(() => {
    const h = () => {
      const ov = getRoleOverride();
      if (ov && options.includes(ov)) setEffectiveRole(ov);
      else setEffectiveRole(realRole);
    };
    window.addEventListener("storage", h);
    window.addEventListener("role-override", h);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("role-override", h);
    };
  }, [realRole, options]);

  // Convenience booleans for UI (use effective role!)
  const isAdminUI = effectiveRole === "admin";
  const isCreatorUI = effectiveRole === "creator" || effectiveRole === "admin";

  return {
    loading,

    // real (from token)
    role: realRole,
    claims,
    isRealAdmin,

    // UI state
    effectiveRole,
    isAdmin: isAdminUI,
    isCreator: isCreatorUI,
    fanEnabled,

    // always an array (never undefined)
    roleOptions: Array.isArray(options) ? options : [],

    // switcher helpers
    setRoleOverride,
    clearRoleOverride,
  };
}
