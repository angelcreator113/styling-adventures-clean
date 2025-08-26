import { useEffect, useState } from "react";

export function useThemeMode(storageKey = "themeMode") {
  const read = () => {
    try { return localStorage.getItem(storageKey) || "light"; }
    catch { return "light"; }
  };
  const [mode, setMode] = useState(read());

  useEffect(() => {
    const onTheme = (e) => setMode(e?.detail?.mode || read());
    const onStorage = (e) => { if (e.key === storageKey) setMode(e.newValue || "light"); };
    window.addEventListener("themechange", onTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("themechange", onTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return mode; // 'light' | 'dark'
}
