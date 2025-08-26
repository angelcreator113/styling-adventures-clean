export function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.background = isError ? "#c0392b" : "#2ecc71";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function updateProgress(percent) {
  const progress = document.getElementById("upload-progress");
  if (!progress) return;

  progress.hidden = false;
  progress.value = percent;

  if (percent >= 100) {
    setTimeout(() => {
      progress.hidden = true;
      progress.value = 0;
    }, 500);
  }
}
