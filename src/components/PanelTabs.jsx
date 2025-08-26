// src/components/PanelTabs.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function PanelTabs({ base }) {
  const link = (to, label) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `inline-block px-3 py-2 rounded-md mr-2 ${isActive ? "bg-purple-100 text-purple-900" : "text-gray-700"}`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="mb-4">
      {link(base, "Upload")}
      {link(`${base}/dashboard`, "Dashboard")}
    </div>
  );
}
