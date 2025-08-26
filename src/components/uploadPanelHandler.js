import { uploadFile, saveFileMetadata } from "../utils/firebase-helpers.js";

/**
 * Sets up a reusable upload button handler for Closet, Voice, or Episode panels.
 * @param {{
 *   panelType: "closet" | "voice" | "episodes",
 *   fileInputId: string,
 *   uploadBtnId: string,
 *   categoryId: string,
 *   subcategoryId: string,
 *   subsubcategoryId: string,
 *   gridSelector: string,
 *   fileType: "image" | "audio" | "video",
 *   showToast?: Function
 * }} config
 */
export function setupUploadPanel(config) {
  const {
    panelType,
    fileInputId,
    uploadBtnId,
    categoryId,
    subcategoryId,
    subsubcategoryId,
    gridSelector,
    fileType,
    showToast = defaultToast
  } = config;

  const fileInput = document.getElementById(fileInputId);
  const uploadBtn = document.getElementById(uploadBtnId);
  const categoryEl = document.getElementById(categoryId);
  const subcategoryEl = document.getElementById(subcategoryId);
  const subsubcategoryEl = document.getElementById(subsubcategoryId);
  const progressEl = document.getElementById("upload-progress");

  if (!fileInput || !uploadBtn) {
    console.warn(`[uploadPanelHandler] Missing fileInput or uploadBtn for ${panelType}`);
    return;
  }

  uploadBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const file = fileInput?.files?.[0];
    const category = categoryEl?.value;
    const subcategory = subcategoryEl?.value;
    const subSubcategory = subsubcategoryEl?.value;

    if (!file || !category) {
      showToast(`❗ Please select a file and choose at least a category.`, true);
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading…";
    progressEl.hidden = false;
    progressEl.value = 0;

    try {
      const storagePath = `${panelType}/${category}/${subcategory || "uncategorized"}/${subSubcategory || "none"}`;
      const fileUrl = await uploadFile(file, storagePath, (progress) => {
        progressEl.value = progress;
      });

      await saveFileMetadata(panelType, {
        filename: file.name,
        url: fileUrl,
        category,
        subcategory: subcategory || null,
        subsubcategory: subSubcategory || null,
        createdAt: new Date().toISOString()
      });

      showToast(`✅ ${capitalize(panelType)} upload successful!`);

      fileInput.value = "";
      categoryEl.selectedIndex = 0;
      subcategoryEl.selectedIndex = 0;
      subsubcategoryEl.selectedIndex = 0;

      const { renderUploadCollection } = await import("../components/syncUploadRenderer.js");
      await renderUploadCollection(panelType, gridSelector, fileType);

    } catch (err) {
      console.error(`❌ ${panelType} upload error:`, err);
      showToast("❌ Upload failed. Check the console for more info.", true);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload";
      progressEl.hidden = true;
      progressEl.value = 0;
    }
  });
}

// 🔔 Default toast fallback
function defaultToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : ""}`;
  toast.textContent = message;
  document.getElementById("toast-container")?.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ✨ Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
