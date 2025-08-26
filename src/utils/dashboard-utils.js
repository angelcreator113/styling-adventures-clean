// dashboard-utils.js

export async function refreshClosetDashboard() {
  showToast("Refreshing Closet Dashboard...");
  closetItems = await loadClosetItemsFromFirestore();
  renderCategoryOptions();
  renderSubcategoryOptions();
  renderGrid();
  showToast("Closet Dashboard Synced");
}

export async function refreshVoiceDashboard() {
  showToast("Refreshing Voice Dashboard...");
  voiceItems = await loadVoiceItemsFromFirestore(); // assume similar pattern
  renderVoiceGrid();
  showToast("Voice Dashboard Synced");
}
export function initDashboards() {
  console.log("🧁 Initializing dashboards...");

  const panels = ["closet", "voice", "episodes"];

  panels.forEach((type) => {
    const gridId = `${type}-dashboard-grid`;
    const gridEl = document.getElementById(gridId);

    if (!gridEl) return;

    console.log(`📦 Dashboard ready: ${type} → #${gridId}`);
    gridEl.innerHTML = `<p class="dashboard-hint">Upload ${type} assets to populate this grid.</p>`;
  });
}
