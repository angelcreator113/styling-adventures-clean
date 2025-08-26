// src/utils/setupDropArea.js

/**
 * Sets up drag-and-drop file upload for a given drop area and file input.
 * @param {string} dropAreaId - ID of the element users drop files onto
 * @param {string} fileInputId - ID of the hidden file input element
 * @param {string} [highlightClass="highlight"] - Optional class to apply when dragging
 */
export function setupDropArea(dropAreaId, fileInputId, highlightClass = "highlight") {
  const dropArea = document.getElementById(dropAreaId);
  const fileInput = document.getElementById(fileInputId);

  if (!dropArea || !fileInput) {
    console.warn(`[setupDropArea] Missing element: ${dropArea ? "" : dropAreaId} ${fileInput ? "" : fileInputId}`);
    return;
  }

  const highlight = () => dropArea.classList.add(highlightClass);
  const unhighlight = () => dropArea.classList.remove(highlightClass);

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      highlight();
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      unhighlight();
    });
  });

  dropArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    fileInput.files = files;
  });

  dropArea.addEventListener("click", () => fileInput.click());
}
