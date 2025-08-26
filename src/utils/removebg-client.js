// src/utils/removebg-client.js
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/utils/init-firebase"; // ensure init-firebase exports `app`

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function base64ToBlob(b64, type = "image/png") {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Calls your HTTPS callable `removeBgPro` and returns a PNG Blob with alpha. */
export async function serverRemoveBackground(blob) {
  const fn = httpsCallable(getFunctions(app, "us-central1"), "removeBgPro");
  const imageBase64 = await blobToBase64(blob);
  const resp = await fn({ imageBase64 });
  const out = resp?.data?.imageBase64;
  if (!out) throw new Error("removeBgPro returned no image");
  return base64ToBlob(out, "image/png");
}
