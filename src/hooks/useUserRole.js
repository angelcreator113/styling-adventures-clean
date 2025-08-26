// src/hooks/useUserRole.js
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth, db } from "@/utils/init-firebase";
import { doc, onSnapshot } from "firebase/firestore";

const OVERRIDE_KEY = "bestie.roleOverride";

function notifyOverrideChange() {
  try { window.dispatchEvent(new Event("role:override-changed")); } catch {}
}

export function setRoleOverride(next) {
  try { localStorage.setItem(OVERRIDE_KEY, next); } catch {}
  notifyOverrideChange();
}
export function clearRoleOverride() {
  try { localStorage.removeItem(OVERRIDE_KEY); } catch {}
  notifyOverrideChange();
}

export function useUserRole() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims]   = useState(null);
  const [uid, setUid]         = useState(null);
  const [fanEnabled, setFanEnabled] = useState(false);
  const [override, setOverride] = useState("");

  // auth + claims
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid || null);
      setFanEnabled(false);
      setClaims(null);
      if (!u) { setLoading(false); return; }
      try {
        const tok = await getIdTokenResult(u, true);
        setClaims(tok?.claims || {});
      } finally {
        setLoading(false);
      }
    });
    return off;
  }, []);

  // fan toggle (profile doc)
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, `users/${uid}/settings/profile`);
    const off = onSnapshot(ref, (snap) => {
      setFanEnabled(!!snap.data()?.fanEnabled);
    }, () => setFanEnabled(false));
    return off;
  }, [uid]);

  // override listener
  useEffect(() => {
    const read = () => {
      try { setOverride(localStorage.getItem(OVERRIDE_KEY) || ""); }
      catch { setOverride(""); }
    };
    read();
    const onStorage = (e) => { if (e.key === OVERRIDE_KEY) read(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("role:override-changed", read);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("role:override-changed", read);
    };
  }, []);

  // base role from claims
  const role = useMemo(() => {
    if (!claims) return "fan";
    if (claims.admin === true || claims.role === "admin") return "admin";
    if (claims.role === "creator") return "creator";
    return "fan";
  }, [claims]);

  // which tabs the user is allowed to view-as
  const roleOptions = useMemo(() => {
    if (role === "admin")   return ["admin", "creator", "fan"];
    if (role === "creator") return fanEnabled ? ["creator", "fan"] : ["creator"];
    return ["fan"];
  }, [role, fanEnabled]);

  // apply override if allowed
  const effectiveRole = useMemo(
    () => (roleOptions.includes(override) ? override : role),
    [role, roleOptions, override]
  );

  return { role, effectiveRole, roleOptions, fanEnabled, loading };
}
