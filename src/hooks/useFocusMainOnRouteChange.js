// src/hooks/useFocusMainOnRouteChange.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * On every route change, move focus to #main-content.
 * Improves keyboard nav & screen reader experience.
 */
export default function useFocusMainOnRouteChange(selector = "#main-content") {
  const loc = useLocation();
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    // allow layout to render first
    requestAnimationFrame(() => {
      el.setAttribute("tabindex", "-1"); // ensure focusable
      el.focus();
    });
  }, [loc.pathname, selector]);
}
