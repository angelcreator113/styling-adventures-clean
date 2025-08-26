// src/components/RoleSwitcher.jsx
import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useAuth } from "@/context/AuthContext";

/**
 * Small, unobtrusive role switcher:
 * - Visible to admins only
 * - Persists per tab via sessionStorage
 * - Optional redirect to each role's home
 */
export default function RoleSwitcher() {
  const nav = useNavigate();
  const loc = useLocation();
  const { primaryRole } = useAuth();
  const { effectiveRole, viewAs, setViewAs } = useEffectiveRole();

  if (primaryRole !== "admin") return null; // only admins see it

  const options = useMemo(
    () => [
      { value: "", label: "Admin (full)" },
      { value: "creator", label: "View as: Creator" },
      { value: "fan", label: "View as: Fan" },
    ],
    []
  );

  const homes = {
    "": "/admin/home",
    admin: "/admin/home",
    creator: "/creator/home",
    fan: "/closet",     // or "/home" if yours routes by role
  };

  function onChange(e) {
    const val = e.target.value; // "", "creator", "fan"
    setViewAs(val);             // updates sessionStorage + broadcasts event
    const target = homes[val || "admin"] || "/home";
    // if you’re already in a matching area, you can stay; otherwise jump to the right home
    const isAlreadyThere =
      (val === "creator" && loc.pathname.startsWith("/creator")) ||
      (val === "fan" && !loc.pathname.startsWith("/admin") && !loc.pathname.startsWith("/creator")) ||
      (val === "" && loc.pathname.startsWith("/admin"));
    if (!isAlreadyThere) nav(target, { replace: true });
  }

  return (
    <label className="role-switcher" title={`Effective role: ${effectiveRole || "admin"}`}>
      <span className="sr-only">Role</span>
      <select
        className="select"
        value={viewAs}
        onChange={onChange}
        aria-label="Switch role view"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
