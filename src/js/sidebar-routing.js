// src/js/sidebar-routing.js
const PANEL_TO_ROUTE = {
  home: "/",
  closet: "/upload/closet",
  voice: "/upload/voice",
  episodes: "/upload/episodes",
  // Add more when you have routes:
  // meta: "/meta",
  // "manage-panels": "/admin/panels",
};

function navigateSPA(path) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function setActiveFromLocation() {
  const buttons = document.querySelectorAll("#sidebar .nav-item[data-panel]");
  buttons.forEach((btn) => btn.classList.remove("active"));

  const current = Object.entries(PANEL_TO_ROUTE).find(
    ([, route]) => route === window.location.pathname
  );
  if (!current) return;

  const [panel] = current;
  const activeBtn = document.querySelector(
    `#sidebar .nav-item[data-panel="${panel}"]`
  );
  if (activeBtn) activeBtn.classList.add("active");
}

export function initSidebarRouting() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  // Delegate clicks from the sidebar
  sidebar.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item[data-panel]");
    if (!btn) return;

    const panel = btn.getAttribute("data-panel");
    const route = PANEL_TO_ROUTE[panel];
    if (route) {
      e.preventDefault();
      navigateSPA(route);
      setActiveFromLocation();
    }
  });

  // Keep active state in sync when user goes back/forward
  window.addEventListener("popstate", setActiveFromLocation);

  // Initial highlight
  setActiveFromLocation();
}
