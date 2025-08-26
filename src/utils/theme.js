// src/utils/theme.js
const KEY = "theme"; // 'auto' | 'light' | 'dark'

export function readTheme() {
  try { return localStorage.getItem(KEY) || "auto"; } catch { return "auto"; }
}

function computeEffective(mode) {
  if (mode !== "auto") return mode;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(preset) {
  const mode = preset || readTheme();
  const effective = computeEffective(mode);

  const root = document.documentElement;
  const body = document.body;

  // Primary switch for your CSS
  root.setAttribute("data-theme", effective);

  // Optional: keep your legacy class toggles if you still reference them anywhere
  root.classList.toggle("light", effective === "light");
  root.classList.toggle("dark",  effective === "dark");
  body.classList.toggle("light",  effective === "light");
  body.classList.toggle("dark",   effective === "dark");

  // announce
  try { window.dispatchEvent(new CustomEvent("themechange", { detail: { mode, effective } })); } catch {}
}

export function setThemeMode(mode) {
  try { localStorage.setItem(KEY, mode); } catch {}
  applyTheme(mode);
}

export function initTheme() {
  applyTheme(readTheme());

  // follow OS when we're in auto
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => { if (readTheme() === "auto") applyTheme(); };
  mql.addEventListener ? mql.addEventListener("change", onChange)
                       : mql.addListener(onChange);
}
