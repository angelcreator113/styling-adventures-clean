// src/js/load-panels.js

// Which panels to load (must exist under /public/components/panels)
export const panelsToLoad = ["closet", "voice", "episodes", "meta", "manage-panels"];

/**
 * Loads HTML partials into the page.
 * Move your panel partials to: public/components/panels/<id>-panel.html
 *
 * @param {Object} options
 * @param {string} options.containerId - The parent container that holds all panels.
 * @param {string} options.wrapperId   - The wrapper created/used inside the container.
 * @param {string} options.basePath    - Public base path where partials live.
 */
export async function loadPanels({
  containerId = "main-content",
  wrapperId = "panel-wrapper",
  basePath = "/components/panels",
} = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[loadPanels] container #${containerId} not found`);
    return;
  }

  // Ensure a wrapper exists (so repeated calls don't duplicate structure)
  let wrapper = document.getElementById(wrapperId);
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = wrapperId;
    container.appendChild(wrapper);
  }

  // Load each panel partial
  for (const id of panelsToLoad) {
    try {
      const res = await fetch(`${basePath}/${id}-panel.html`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = (await res.text()).trim();

      const tmp = document.createElement("div");
      tmp.innerHTML = html;

      const node = tmp.firstElementChild;
      if (node) {
        node.setAttribute("data-panel", id);
        wrapper.appendChild(node);
      }
    } catch (err) {
      console.warn(`[loadPanels] failed to load ${id}-panel.html from ${basePath}`, err);
    }
  }
}
