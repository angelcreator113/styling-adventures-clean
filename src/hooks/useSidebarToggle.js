// src/hooks/useSidebarToggle.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Controls the sidebar via data attributes on `.app-shell`
 * - Desktop: toggles `data-sidebar="collapsed"`
 * - Mobile (<768px): toggles `data-sidebar="open"`
 * - Remembers collapsed state in localStorage
 * - Closes on route change (call `resetMobile()` from Topbar when location changes)
 */
export function useSidebarToggle() {
  const appShellRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  const media = useMemo(() => window.matchMedia("(max-width: 768px)"), []);

  // cache root
  useEffect(() => {
    appShellRef.current = document.querySelector(".app-shell");
  }, []);

  // watch media
  useEffect(() => {
    const onChange = (e) => setIsMobile(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [media]);

  // restore desktop collapsed state
  useEffect(() => {
    const shell = appShellRef.current;
    if (!shell) return;
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved === "1" && !isMobile) shell.setAttribute("data-sidebar", "collapsed");
  }, [isMobile]);

  const collapseDesktop = useCallback(() => {
    const shell = appShellRef.current;
    if (!shell) return;
    shell.setAttribute("data-sidebar", "collapsed");
    localStorage.setItem("sidebar:collapsed", "1");
  }, []);

  const expandDesktop = useCallback(() => {
    const shell = appShellRef.current;
    if (!shell) return;
    if (shell.getAttribute("data-sidebar") === "collapsed") {
      shell.removeAttribute("data-sidebar");
    }
    localStorage.removeItem("sidebar:collapsed");
  }, []);

  const toggleDesktop = useCallback(() => {
    const shell = appShellRef.current;
    if (!shell) return;
    const collapsed = shell.getAttribute("data-sidebar") === "collapsed";
    if (collapsed) {
      shell.removeAttribute("data-sidebar");
      localStorage.removeItem("sidebar:collapsed");
    } else {
      shell.setAttribute("data-sidebar", "collapsed");
      localStorage.setItem("sidebar:collapsed", "1");
    }
  }, []);

  const openMobile = useCallback(() => {
    const shell = appShellRef.current;
    if (!shell) return;
    shell.setAttribute("data-sidebar", "open");
    // trap Esc to close while open
    const onKey = (e) => {
      if (e.key === "Escape") shell.removeAttribute("data-sidebar");
    };
    document.addEventListener("keydown", onKey, { once: true });
  }, []);

  const closeMobile = useCallback(() => {
    const shell = appShellRef.current;
    if (!shell) return;
    if (shell.getAttribute("data-sidebar") === "open") shell.removeAttribute("data-sidebar");
  }, []);

  const toggle = useCallback(() => {
    if (isMobile) {
      const shell = appShellRef.current;
      if (!shell) return;
      const open = shell.getAttribute("data-sidebar") === "open";
      if (open) closeMobile(); else openMobile();
    } else {
      toggleDesktop();
    }
  }, [isMobile, openMobile, closeMobile, toggleDesktop]);

  return {
    isMobile,
    toggle,
    collapseDesktop,
    expandDesktop,
    openMobile,
    closeMobile,
    resetMobile: closeMobile,
  };
}
