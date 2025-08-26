import React from "react";
import { Link } from "react-router-dom";

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map(({ path, text, isLast }) => (
        <span key={path} className="crumb">
          {!isLast ? <Link to={path}>{text}</Link> : <span aria-current="page">{text}</span>}
          {!isLast && <span className="crumb-sep">/</span>}
        </span>
      ))}
    </nav>
  );
}
