import React from "react";
import { Link } from "react-router-dom";

/**
 * Small brand chip for the Topbar.
 * Collapses to just the logo on narrow screens (handled by CSS).
 */
export default function TopbarBrand({
  name = "Lala AI Studio",
  logoSrc = "/assets/lala-avatar.png",
  to = "/home",
  title,
}) {
  const label = title || name;
  return (
    <Link
      to={to}
      className="brand-chip"
      aria-label={label}
      title={label}
    >
      <img src={logoSrc} alt="" aria-hidden="true" />
      <span className="brand-name">{name}</span>
    </Link>
  );
}
