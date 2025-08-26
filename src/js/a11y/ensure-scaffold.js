// src/js/a11y/ensure-scaffold.js
// Ensures a skip link exists + a focusable #main-content is present (SPA + HMR safe)

let installed = false;

export function ensureA11yScaffold() {
  if (installed && document.documentElement.dataset.a11yReady === "1") return;
  installed = true;
  document.documentElement.dataset.a11yReady = "1";

  // 1) Ensure skip link (visually hidden until focus)
  let skip = document.querySelector(".skip-link");
  if (!skip) {
    skip = document.createElement("a");
    skip.className = "skip-link vh--focusable";
    skip.href = "#main-content";
    skip.textContent = "Skip to content";
    document.body.prepend(skip);
  }

  // 2) Ensure a main container with id="main-content" (do NOT move #root)
  let main =
    document.getElementById("main-content") ||
    document.querySelector("main#main-content") ||
    document.querySelector('[role="main"]#main-content');

  if (!main) {
    // Create a lightweight focus target near the top of the app
    main = document.createElement("main");
    main.id = "main-content";
    main.setAttribute("role", "main");
    main.setAttribute("tabindex", "-1");
    // place right after <body> so the jump is immediate
    const first = document.body.firstElementChild;
    if (first) document.body.insertBefore(main, first.nextSibling);
    else document.body.appendChild(main);
  } else if (!main.hasAttribute("tabindex")) {
    main.setAttribute("tabindex", "-1");
  }

  // 3) Bind skip -> focus (de-dupe across hot reloads)
  if (window.__a11yOnSkipClick) {
    window.removeEventListener("click", window.__a11yOnSkipClick, true);
  }
  const onSkipClick = (e) => {
    if (!e.target.closest(".skip-link")) return;
    e.preventDefault();
    // Wait a frame so layout/styles settle
    requestAnimationFrame(() => main && main.focus());
  };
  window.addEventListener("click", onSkipClick, true);
  window.__a11yOnSkipClick = onSkipClick;

  // 4) Support focusing via #main-content hash (Enter on link, direct load)
  if (window.__a11yOnHashChange) {
    window.removeEventListener("hashchange", window.__a11yOnHashChange);
  }
  const onHash = () => {
    if (location.hash === "#main-content") {
      requestAnimationFrame(() => main && main.focus());
    }
  };
  window.addEventListener("hashchange", onHash);
  window.__a11yOnHashChange = onHash;

  // If the page already has the hash on first run, honor it
  onHash();
}


