// Lightweight, Strict-Mode-safe drag & drop helpers

// Registry by element id => { remove, obs }
const dropRegistry = new Map();

/** Normalize element or id to an Element. */
function elOf(elOrId) {
  if (elOrId instanceof Element) return elOrId;
  const el = document.getElementById(String(elOrId));
  if (!el) throw new Error(`[dragdrop] Element not found: ${elOrId}`);
  return el;
}

function add(el, type, handler, bag) {
  el.addEventListener(type, handler);
  bag.push(() => el.removeEventListener(type, handler));
}

function parseAcceptAttr(acceptAttr) {
  if (!acceptAttr) return [];
  return acceptAttr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mimeMatches(file, accepted) {
  if (!accepted || accepted.length === 0) return true;
  const name = (file.name || "").toLowerCase();
  return accepted.some((pat) => {
    if (!pat) return false;
    if (pat.endsWith("/*")) return file.type.startsWith(pat.slice(0, -1)); // image/* etc
    if (pat.endsWith("/"))  return file.type.startsWith(pat);              // image/
    if (pat.includes("/"))  return file.type === pat;                      // image/png
    if (pat.startsWith(".")) return name.endsWith(pat.toLowerCase());      // .png
    return false;
  });
}

/**
 * Attach drag/drop behavior to an element. Returns a teardown function.
 *
 * @param {Element|string} elOrId
 * @param {{
 *   onFiles?: (files: File[], ctx: {event: DragEvent|MouseEvent, el: HTMLElement}) => void,
 *   acceptedTypes?: string[],
 *   preventClickDuringDrop?: boolean,
 *   inputEl?: HTMLInputElement,
 *   multiple?: boolean,
 *   maxFiles?: number,
 *   hoverClass?: string
 * }} [opts]
 */
export function attachDropArea(elOrId, opts = {}) {
  const el = elOf(elOrId);
  const key = el.id || elOrId;
  const hoverClass = opts.hoverClass || "drag-over";

  // Remove any previous listeners for this node (Strict Mode / re-mounts)
  dropRegistry.get(key)?.remove?.();

  // If not provided, infer from nested input's "accept"
  const inferredAccept = opts.inputEl?.accept ? parseAcceptAttr(opts.inputEl.accept) : [];
  const accepted =
    (opts.acceptedTypes && opts.acceptedTypes.length > 0) ? opts.acceptedTypes : inferredAccept;

  const bag = [];

  // a11y: if clickable, make it keyboard-activatable
  if (!opts.preventClickDuringDrop) {
    if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
  }

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    el.classList.add(hoverClass);
  };
  const onDragLeave = () => {
    el.classList.remove(hoverClass);
  };
  const onDrop = (e) => {
    e.preventDefault();
    el.classList.remove(hoverClass);

    const all = Array.from(e.dataTransfer?.files || []);
    if (!all.length) return;

    let files = accepted.length ? all.filter((f) => mimeMatches(f, accepted)) : all;
    if (!files.length) {
      console.warn("[dragdrop] No files matched acceptedTypes for", key);
      return;
    }

    // Respect multiple/maxFiles constraints
    const multiple = opts.multiple ?? opts.inputEl?.multiple ?? true;
    if (!multiple && files.length > 1) files = [files[0]];
    if (typeof opts.maxFiles === "number" && opts.maxFiles > 0) {
      files = files.slice(0, opts.maxFiles);
    }

    // Mirror into input if provided
    if (opts.inputEl) {
      try {
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        opts.inputEl.files = dt.files;
        opts.inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (err) {
        console.warn("[dragdrop] Could not set input files:", err);
      }
    }

    try { opts.onFiles?.(files, { event: e, el }); } catch (err) {
      console.error("[dragdrop] onFiles error:", err);
    }
    try { el.dispatchEvent(new CustomEvent("drop:files", { detail: { files } })); } catch {}
  };

  add(el, "dragover", onDragOver, bag);
  add(el, "dragenter", onDragOver, bag);
  add(el, "dragleave", onDragLeave, bag);
  add(el, "drop", onDrop, bag);

  // ---- SINGLE-OPEN GUARD to prevent double file dialogs ----
  let isChoosing = false;
  function armChoosingGuard() {
    isChoosing = true;
    const t = setTimeout(() => { isChoosing = false; }, 1500);
    bag.push(() => clearTimeout(t));
  }

  if (!opts.preventClickDuringDrop) {
    const openPicker = () => {
      if (!opts.inputEl) return;
      if (isChoosing) return; // guard against double-open
      armChoosingGuard();
      opts.inputEl.click();
    };
    add(el, "click", openPicker, bag);
    add(el, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPicker();
      }
    }, bag);
  }

  if (opts.inputEl) {
    add(opts.inputEl, "change", () => { isChoosing = false; }, bag);
    add(window, "focus", () => { isChoosing = false; }, bag);
  }
  // ----------------------------------------------------------

  // Auto-cleanup when node is removed
  const remove = () => {
    while (bag.length) { try { bag.pop()(); } catch {} }
    try { obs.disconnect(); } catch {}
    dropRegistry.delete(key);
  };

  const obs = new MutationObserver(() => {
    if (!document.body.contains(el)) remove();
  });
  obs.observe(document.body, { childList: true, subtree: true });

  dropRegistry.set(key, { remove, obs });
  console.log(`[dragdrop] Initialized: #${key}`);
  return remove;
}

/**
 * Backward-compat initializer: wires multiple areas.
 * Each config: { inputId, dropAreaId, options }
 */
export function initDragDropUploadDynamic(configs) {
  configs.forEach(({ inputId, dropAreaId, options = {} }) => {
    const dropEl  = document.getElementById(dropAreaId);
    const inputEl = document.getElementById(inputId);

    if (!dropEl || !inputEl) {
      console.warn(`[dragdrop] Missing elements for ${dropAreaId}`);
      return;
    }

    const teardown = attachDropArea(dropEl, {
      ...options,
      inputEl,
      onFiles: (files, ctx) => {
        try {
          const dt = new DataTransfer();
          files.forEach((f) => dt.items.add(f));
          inputEl.files = dt.files;
          inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (err) {
          console.warn("[dragdrop] Could not set input files:", err);
        }
        options.onFiles?.(files, ctx);
      },
    });

    dropRegistry.set(dropAreaId, { remove: teardown });
  });
}
