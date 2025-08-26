import { useEffect, useRef, useState } from "react";

export function useSidebarDrawer(initialCollapsed = false) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [open, setOpen] = useState(false);
  const toggleBtnRef = useRef(null);

  const shell = () => document.querySelector(".app-shell");
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  // reflect collapsed on desktop
  useEffect(() => {
    const el = shell();
    if (!el) return;
    if (collapsed) el.setAttribute("data-sidebar", "collapsed");
    else if (el.getAttribute("data-sidebar") === "collapsed") el.removeAttribute("data-sidebar");
  }, [collapsed]);

  const restoreCollapsedAttr = () => {
    const el = shell();
    if (!el) return;
    if (collapsed) el.setAttribute("data-sidebar", "collapsed");
    else if (el.getAttribute("data-sidebar") === "collapsed") el.removeAttribute("data-sidebar");
  };

  const openMobile = () => {
    const el = shell();
    if (!el) return;
    el.setAttribute("data-sidebar", "open");
    document.body.classList.add("body-lock");
    setOpen(true);
  };
  const closeMobile = () => {
    const el = shell();
    if (!el) return;
    if (el.getAttribute("data-sidebar") === "open") el.removeAttribute("data-sidebar");
    document.body.classList.remove("body-lock");
    setOpen(false);
    restoreCollapsedAttr();
  };

  const toggle = () => {
    if (isMobile()) setOpen(v => (v ? (closeMobile(), false) : (openMobile(), true)));
    else {
      setCollapsed(v => {
        const next = !v;
        localStorage.setItem("sbCollapsed", String(next));
        return next;
      });
    }
  };

  // close on route change if open (caller can call closeMobile manually)

  // click-away + Esc
  useEffect(() => {
    const onDocPointer = (e) => {
      if (!open) return;
      const sidebarEl = document.querySelector(".sidebar");
      const withinSidebar = sidebarEl?.contains(e.target);
      const withinToggle = toggleBtnRef.current?.contains(e.target);
      if (!withinSidebar && !withinToggle) closeMobile();
    };
    const onKey = (e) => { if (e.key === "Escape") closeMobile(); };
    document.addEventListener("pointerdown", onDocPointer, true);
    if (open) document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // resize up closes drawer
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = (ev) => { if (!ev.matches) closeMobile(); };
    mql.addEventListener?.("change", onChange) ?? mql.addListener(onChange);
    return () => mql.removeEventListener?.("change", onChange) ?? mql.removeListener(onChange);
  }, []);

  return { collapsed, open, toggle, toggleBtnRef, closeMobile };
}
