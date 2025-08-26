// src/js/main.js  (legacy pages only)
if (!document.querySelector('#root')) {
  // Import only when not running the React app
  Promise.all([
    import('../utils/form-injector.js'),
    import('../utils/dashboard-utils.js')
  ]).then(([{ injectUploadForms }, { initDashboards }]) => {
    const INIT_DELAY = 300;
    let hasInitialized = false;

    document.addEventListener("DOMContentLoaded", () => {
      console.log("[main] DOM ready. Injecting forms...");

      if (typeof window.showPanel === "function") {
        window.showPanel("closet");
      } else {
        console.warn("⚠️ window.showPanel not available yet.");
      }

      const observer = new MutationObserver(() => {
        if (hasInitialized) return;

        clearTimeout(window.initTimeout);
        window.initTimeout = setTimeout(() => {
          const allGridsExist =
            document.getElementById("closet-dashboard-grid") &&
            document.getElementById("voice-dashboard-grid") &&
            document.getElementById("episode-dashboard-grid");

          if (allGridsExist) {
            console.log("✅ All dashboard grids detected. Initializing...");
            initDashboards();
            hasInitialized = true;
            observer.disconnect();
          }
        }, INIT_DELAY);
      });

      const mainArea = document.querySelector(".main-content");
      if (mainArea) {
        observer.observe(mainArea, { childList: true, subtree: true });
      }
    });
  });
}
