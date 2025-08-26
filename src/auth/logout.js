// src/auth/logout.js

import { auth } from "../utils/init-firebase.js";
import { signOut, onAuthStateChanged } from "firebase/auth";

// Optional toast (fallback to alert)
let showToast = (msg, type) => alert(msg);
(async () => {
  try {
    const mod = await import("../utils/firebase-helpers.js");
    if (typeof mod.showToast === "function") showToast = mod.showToast;
  } catch { /* noop */ }
})();

function redirectToLogin() {
  // SPA route
  window.location.href = "/login";
}

// ---- Core action (EXPORTED) ----
export async function logoutUser() {
  try {
    await signOut(auth);
    showToast("Logged out", "success");
    redirectToLogin();
  } catch (err) {
    console.error("[logout] signOut failed:", err);
    showToast("Logout failed", "error");
  }
}

// ---- Optional DOM wiring (EXPORTED) ----
// Only call this if you still have a #logout-btn somewhere in raw HTML.
export function initLogoutUI() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) {
    console.warn("[logout] #logout-btn not found");
    return;
  }

  const modal = document.getElementById("logout-modal");
  const confirmBtn = document.getElementById("confirm-logout");
  const cancelBtn = document.getElementById("cancel-logout");

  if (modal && confirmBtn && cancelBtn) {
    logoutBtn.addEventListener("click", () => modal.classList.add("active"));
    cancelBtn.addEventListener("click", () => modal.classList.remove("active"));
    confirmBtn.addEventListener("click", async () => {
      modal.classList.remove("active");
      await logoutUser();
    });
  } else {
    logoutBtn.addEventListener("click", async () => {
      const ok = window.confirm("Log out?");
      if (!ok) return;
      await logoutUser();
    });
  }
}

// ---- Auth guard (keep) ----
onAuthStateChanged(auth, (user) => {
  if (!user && location.pathname !== "/login") {
    redirectToLogin();
  }
});
