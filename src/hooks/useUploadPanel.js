// src/hooks/useUploadPanel.js
// Generic upload panel used by Closet and (optionally) Creator Files.
// - Adds uid + visibility + public (legacy) so Firestore rules pass.
// - Auto-brands preview using users/{uid}/settings/brand.themeId.
// - Handles dedupe + quick re-try UX.
// - Ready for future "Creator Files" routing via `dest` option (see below).

import { auth, db } from "@/utils/init-firebase";
import { uploadFileWithProgress } from "@/utils/firebase-helpers";
import { processImageBlob } from "@/utils/image-pipeline";
import { autoCurateOnUpload } from "@/utils/board-helpers";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  limit,
  getDoc,
} from "firebase/firestore";

const $ = (id) => document.getElementById(id);
const safeId = (x) => x?.replace?.(/\s+/g, "-") || "item";

/**
 * Read feature toggles from UI.
 * Works with both the new (#closet-feat-*) and older (#closet-is-public) ids.
 */
function readTools(uiPrefix) {
  const q = (id, d) => {
    const el = document.getElementById(id);
    return typeof el?.checked === "boolean" ? el.checked : d;
  };
  const v = (id, d) => {
    const el = document.getElementById(id);
    return (el && "value" in el) ? el.value : d;
  };

  const pubNew = q(`${uiPrefix}feat-public`, null);
  const pubOld = q(`${uiPrefix}is-public`, null);
  const makePublic = (pubNew ?? pubOld ?? true);

  return {
    smartCompress:    q(`${uiPrefix}feat-compress`, true),
    trimBg:           q(`${uiPrefix}feat-trim`, true),
    padToSquare:      q(`${uiPrefix}feat-pad`, true),
    autoName:         q(`${uiPrefix}feat-autoname`, true),
    makePublic, // ← visibility/public
    preferServer:     q(`${uiPrefix}feat-server`, true),

    // appearance
    theme:            v(`${uiPrefix}appearance-theme`, "lavender"),

    // derived assets
    exportPreview:    q(`${uiPrefix}export-preview`, true),
    exportIcon:       q(`${uiPrefix}export-icon`, true),
    exportIconHover:  q(`${uiPrefix}export-icon-hover`, true),

    // optional data attributes
    dest:             v(`${uiPrefix}dest`, "closet"), // future: 'files' for Creator Files
  };
}

async function sha256Hex(blob, take = 20) {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(hash);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex.slice(0, take);
}

/** Remove duplicate closet docs that might have been written by legacy listeners. */
async function cleanupRecentDuplicates({ uid, keepId, storagePath, fileName }) {
  try {
    const col = collection(db, `users/${uid}/closet`);

    const byPathQ = query(col, where("storagePath", "==", storagePath));
    const byPath = await getDocs(byPathQ);

    const recentQ = query(col, orderBy("uploadedAt", "desc"), limit(20));
    const recent = await getDocs(recentQ);

    const dupIds = new Set();

    byPath.forEach((d) => {
      if (d.id !== keepId) dupIds.add(d.id);
    });

    const nowSec = Math.floor(Date.now() / 1000);
    recent.forEach((d) => {
      if (d.id === keepId) return;
      const data = d.data() || {};
      const ts = data.uploadedAt?.seconds || 0;
      const age = nowSec - ts;
      if (age >= 0 && age <= 120) {
        if ((data.fileName || "") === (fileName || "")) {
          dupIds.add(d.id);
        }
      }
    });

    const deletions = Array.from(dupIds).map((id) =>
      deleteDoc(doc(db, `users/${uid}/closet/${id}`)).catch(() => {})
    );
    await Promise.all(deletions);
  } catch {
    // best-effort only
  }
}

/**
 * Reads the signed-in user's brand themeId (for auto-branded preview canvas).
 */
async function resolveThemeId(user, tools) {
  try {
    const snap = await getDoc(doc(db, `users/${user.uid}/settings/brand`));
    const tid = snap.exists() ? (snap.data().themeId || "") : "";
    return tid || tools.theme || "lavender";
  } catch {
    return tools.theme || "lavender";
  }
}

/**
 * Initialize one upload panel instance.
 *
 * @param {string} slug     - storage slug/bucket subpath selector used by uploadFileWithProgress
 * @param {string} uiPrefix - DOM id prefix for your panel inputs (e.g. "closet-")
 *
 * Optional: to experiment with Creator Files, set a hidden input
 *   <input id={`${uiPrefix}dest`} value="files" />
 * and provide category/folder fields (see where we read cat/sub below).
 * Your firebase-helpers would need to route Firestore writes accordingly.
 */
export function initUploadPanel(slug, uiPrefix) {
  const GUARD_KEY = `__bestieUploadInit__${uiPrefix}`;
  if (typeof window !== "undefined" && window[GUARD_KEY]) return window[GUARD_KEY];

  const input      = $(`${uiPrefix}file-input`);
  const drop       = $(`${uiPrefix}drop-area`);
  const list       = $(`${uiPrefix}file-list`);
  const prog       = $(`${uiPrefix}progress`);
  const progLbl    = $(`${uiPrefix}progress-label`);
  const uploadBtn  = $(`${uiPrefix}upload-btn`);

  let selectedFileBlob = null;
  let derived = null;
  let dedupeId = null;
  let currentPreviewURL = null;
  let uploadLock = false;

  function setProgress(p, label, mode = "normal") {
    if (!prog) return;
    prog.hidden = false;
    prog.value = p;
    prog.dataset.mode = mode;
    if (progLbl) progLbl.textContent = label || `${Math.round(p)}%`;
    if (p >= 100 && mode !== "ready") {
      setTimeout(() => {
        prog.hidden = true;
        if (progLbl) progLbl.textContent = "";
        prog.dataset.mode = "normal";
      }, 400);
    }
  }
  function markReady() {
    setProgress(100, "Ready to Upload", "ready");
    prog?.classList.add("is-ready");
  }
  function clearReady() {
    prog?.classList.remove("is-ready");
    prog?.removeAttribute("data-mode");
  }

  function renderPreview(url, title = "Ready to Upload") {
    if (!list) return;
    list.dataset.empty = "false";
    list.innerHTML = "";
    const card = document.createElement("div");
    card.className = "file-card";
    card.innerHTML = `
      <div class="file-thumb"></div>
      <div class="file-meta"><div class="file-title"></div></div>
    `;
    const thumb = card.querySelector(".file-thumb");
    thumb.style.backgroundImage = `url("${url}")`;
    thumb.style.backgroundPosition = "center";
    thumb.style.backgroundRepeat = "no-repeat";
    thumb.style.backgroundSize = "contain";
    thumb.style.width = "100%";
    thumb.style.aspectRatio = "3 / 4";
    thumb.style.border = "1px solid #eee";
    thumb.style.borderRadius = "12px";
    thumb.style.backgroundColor = "#fff";
    thumb.style.padding = "10px";

    card.querySelector(".file-title").textContent = title;
    list.append(card);
    currentPreviewURL = url;
  }

  function clearPreview() {
    if (!list) return;
    list.innerHTML = "";
    list.dataset.empty = "true";
    try {
      if (currentPreviewURL && currentPreviewURL.startsWith("blob:")) URL.revokeObjectURL(currentPreviewURL);
    } catch {}
    currentPreviewURL = null;
  }

  async function ingest(fileOrBlob) {
    if (!fileOrBlob) return;
    const user = auth.currentUser;
    if (!user) { alert("Please sign in"); return; }

    clearReady();
    setProgress(0, "Processing…");

    const tools = readTools(uiPrefix);
    const previewTheme = await resolveThemeId(user, tools);

    const {
      cutoutBlob,
      previewBlob,
      previewUrl,
      iconBlob,
      iconHoverBlob
    } = await processImageBlob(fileOrBlob, {
      smartCompress: tools.smartCompress,
      trimBg: tools.trimBg,
      padToSquare: tools.padToSquare,
      previewTheme,               // ← brand theme canvas
      preferServer: tools.preferServer,
      exportPreview: tools.exportPreview,
      exportIcon: tools.exportIcon,
      exportIconHover: tools.exportIconHover,
    });

    const hash = await sha256Hex(cutoutBlob, 20);
    dedupeId = `${user.uid}-${hash}`;

    renderPreview(previewUrl || URL.createObjectURL(cutoutBlob), "Ready to Upload");
    selectedFileBlob = cutoutBlob;
    derived = { previewBlob, iconBlob, iconHoverBlob };

    markReady();
  }

  async function handleUpload(ev) {
    ev?.preventDefault?.();
    if (!uploadBtn) return;
    if (uploadLock || uploadBtn.getAttribute("data-busy") === "1") return;

    uploadLock = true;
    uploadBtn.setAttribute("data-busy", "1");
    uploadBtn.disabled = true;
    clearReady();

    try {
      if (!selectedFileBlob) { alert("Please choose an image first"); return; }
      const user = auth.currentUser;
      if (!user) { alert("Please sign in"); return; }

      const tools = readTools(uiPrefix);

      // Category/folder fields from panel (used by closet and can also power Creator Files later)
      const titleNode = $(`${uiPrefix}title`);
      const cat  = $(`${uiPrefix}category`)?.value || "";        // Category
      const sub  = $(`${uiPrefix}subcategory`)?.value || "";     // Subfolder / Subcategory
      const ssc  = $(`${uiPrefix}subsubcategory`)?.value || "";  // Sub-subfolder / Sub-subcategory

      const baseTitle =
        titleNode?.value?.trim() ||
        (tools.autoName ? safeId(`Closet Item ${Date.now()}`) : "");

      // one-time confirmation token (guards closet writes in helpers)
      const intentToken = `${user.uid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      window.__bestie_intentToken = intentToken;

      const extraUploads = [];
      if (tools.exportPreview && derived?.previewBlob) {
        extraUploads.push({ key: "preview", blob: derived.previewBlob, contentType: "image/jpeg" });
      }
      if (tools.exportIcon && derived?.iconBlob) {
        extraUploads.push({ key: "icon", blob: derived.iconBlob, contentType: "image/png" });
      }
      if (tools.exportIconHover && derived?.iconHoverBlob) {
        extraUploads.push({ key: "iconHover", blob: derived.iconHoverBlob, contentType: "image/png" });
      }

      setProgress(2, "Uploading…");

      // IMPORTANT: the metadata below MUST be persisted into the Firestore doc by helpers.
      const res = await uploadFileWithProgress(selectedFileBlob, {
        slug,                // e.g. "closet"
        public: tools.makePublic, // still used by storage rules / helpers
        uiPrefix,
        onProgress: (pct) => setProgress(pct, pct >= 99 ? "Finishing…" : undefined),
        metadata: {
          // required for your rules:
          uid: user.uid,
          visibility: tools.makePublic ? "public" : "private",
          public: !!tools.makePublic, // legacy flag kept in sync

          // content + categorization
          title: baseTitle,
          category: cat,
          subcategory: sub,
          subsubcategory: ssc,

          // provenance + features
          confirmedByUser: true,
          intentToken,
          clientUploadId: dedupeId,
          features: tools,

          // http meta
          contentType: "image/png",
          cacheControl: "public,max-age=31536000",

          // optional: future routing for Creator Files
          // dest: tools.dest, // 'closet' | 'files' (use later if your helper supports it)
        },
        extraUploads,
      });

      if (res?.cancelled) {
        setProgress(0, "Cancelled");
        return;
      }

      const previewUrl = res?.assets?.preview?.url || "";
      // Auto-curate (Boards) on upload (best-effort)
      await autoCurateOnUpload({ uid: user.uid, itemId: res?.docId, category: cat, previewUrl });

      // Legacy duplicate cleanup (closet)
      await cleanupRecentDuplicates({
        uid: user.uid,
        keepId: res?.docId,
        storagePath: res?.fullPath,
        fileName: res?.fileName,
      });

      selectedFileBlob = null;
      dedupeId = null;
      derived = null;
      clearPreview();
      setProgress(100, "Uploaded");
    } catch (err) {
      console.warn("[upload] failed", err);
      alert("Upload failed. See console.");
    } finally {
      uploadBtn.removeAttribute("data-busy");
      uploadBtn.disabled = false;
      uploadLock = false;
      setTimeout(() => { try { delete window.__bestie_intentToken; } catch {} }, 1500);
    }
  }

  // Wire events
  if (uploadBtn) {
    const OLD_KEY = `__bestieUploadClick__${uiPrefix}`;
    if (window[OLD_KEY]) uploadBtn.removeEventListener("click", window[OLD_KEY]);
    window[OLD_KEY] = handleUpload;
    uploadBtn.addEventListener("click", handleUpload);
  }
  input?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await ingest(f);
    input.value = "";
  });
  drop?.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-hover"); });
  drop?.addEventListener("dragleave", () => drop.classList.remove("is-hover"));
  drop?.addEventListener("drop", async (e) => {
    e.preventDefault(); drop.classList.remove("is-hover");
    const f = e.dataTransfer.files?.[0];
    if (f) await ingest(f);
  });

  // Manual trigger API (used by camera/canvas integrations)
  document.addEventListener("bestie:manualProcess", async (ev) => {
    const { blob, uiPrefix: from } = ev.detail || {};
    if (!blob) return;
    if (from && from !== uiPrefix) return;
    await ingest(blob);
  }, { passive: true });

  const api = { ingest };
  if (typeof window !== "undefined") window[GUARD_KEY] = api;
  return api;
}

export const useUploadPanel = initUploadPanel;
