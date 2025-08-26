import { useEffect } from "react";

export function useTopbarShortcuts({ searchInputRef, primary }) {
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea" || t?.isContentEditable;

      // Focus search with "/"
      if (!typing && e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // NEW: Focus search with Cmd/Ctrl + K
      if (!typing && e.key?.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Blur search with Escape
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }

      // Trigger primary action with "n"
      if (!typing && e.key?.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        primary.onClick();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchInputRef, primary]);
}
