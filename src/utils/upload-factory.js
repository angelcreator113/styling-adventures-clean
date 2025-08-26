// src/utils/upload-factory.js

// Kept in case other code imports it, but now it's “safe”
export function createUploadUI({ uiPrefix }) {
  const inputEl  = document.getElementById(`${uiPrefix}file-input`);
  const formEl   = document.getElementById(`${uiPrefix}upload-form`);

  if (!(inputEl && formEl)) {
    console.warn("[upload-factory] minimal mode: missing elements for", uiPrefix);
    return () => {};
  }

  // Minimal: when input changes, notify pages that listen for it.
  const onChange = () => {
    document.dispatchEvent(
      new CustomEvent("upload:files", { detail: { uiPrefix, files: inputEl.files } })
    );
  };
  inputEl.addEventListener("change", onChange);

  return () => {
    inputEl.removeEventListener("change", onChange);
  };
}

// keep the API surface (no-op)
export function registerUploader() {}
