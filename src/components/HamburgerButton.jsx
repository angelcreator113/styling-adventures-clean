// src/components/HamburgerButton.jsx
import React from "react";
import { useSidebarToggle } from "../hooks/useSidebarToggle";

export default function HamburgerButton({ className = "hamburger" }) {
  const { isMobile, toggle } = useSidebarToggle();

  return (
    <button
      type="button"
      className={className}
      aria-label={isMobile ? "Toggle navigation drawer" : "Collapse sidebar"}
      aria-pressed="false"
      onClick={toggle}
    >
      {/* Simple system icon — replace with your SVG if you want */}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"></path>
      </svg>
    </button>
  );
}
