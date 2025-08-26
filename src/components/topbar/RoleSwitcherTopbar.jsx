// src/components/topbar/RoleSwitcherTopbar.jsx
import React, { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole, setRoleOverride, clearRoleOverride } from "@/hooks/RoleGates";

export default function RoleSwitcherTopbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const { role: realRole, effectiveRole, roleOptions } = useUserRole();

  // nothing to switch? render nothing
  if (!roleOptions.length) return null;

  // Build select options. "" means "no override" → use real role
  const options = useMemo(() => {
    const labels = { admin: "Admin (full)", creator: "View as: Creator", fan: "View as: Fan" };
    // Ensure admin appears last (cosmetic)
    const sorted = [...roleOptions].sort((a,b) => (a==="admin") - (b==="admin"));
    return sorted.map((r) => ({
      value: r === realRole ? "" : r,
      label: labels[r] || r,
      role: r,
    }));
  }, [roleOptions, realRole]);

  // Current value in the select
  const currentValue = effectiveRole === realRole ? "" : effectiveRole;

  const homes = useMemo(() => ({
    "": realRole === "admin" ? "/admin/home" : realRole === "creator" ? "/creator/home" : "/home",
    admin: "/admin/home",
    creator: "/creator/home",
    fan: "/home"     // or "/closet" if you prefer
  }), [realRole]);

  const areaOf = (p) => (p.startsWith("/admin") ? "admin" : p.startsWith("/creator") ? "creator" : "fan");

  const onChange = useCallback((e) => {
    const val = e.target.value;              // "" | "creator" | "fan" | "admin"
    if (val === currentValue) return;

    if (!val) clearRoleOverride();
    else setRoleOverride(val);

    const target = homes[val || ""] || "/home";
    const desiredArea = val || (realRole || "fan");
    // If we’re already in the correct area, stay put.
    if (areaOf(loc.pathname) === desiredArea) return;

    // navigate on the next macrotask to let guards settle
    setTimeout(() => nav(target, { replace: true }), 0);
  }, [currentValue, homes, loc.pathname, nav, realRole]);

  return (
    <label className="role-switcher" title={`Role: ${effectiveRole}`}>
      <span className="sr-only">Switch role view</span>
      <select className="select" value={currentValue} onChange={onChange} aria-label="Switch role view">
        {options.map((o) => (
          <option key={`${o.role}-${o.value || "default"}`} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

