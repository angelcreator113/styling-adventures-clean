// src/utils/image-pipeline.js
import { app, auth } from "@/utils/init-firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getEffectiveThemeForUser, BUILTIN_THEMES } from "@/utils/theme-service";
import { serverRemoveBackground } from "@/utils/removebg-client";

// --- pixel-centering helpers (existing) -------------------------------------
async function blobToBitmap(blob) {
  // Safari needs createImageBitmap blob type fix sometimes, but this works broadly
  return await createImageBitmap(blob);
}

function getAlphaBoundsFromImageData(imgData, w, h, threshold = 8) {
  // returns {minX,maxX,minY,maxY,cx,cy,width,height}. If empty, fall back to full image.
  let minX = w, minY = h, maxX = -1, maxY = -1;
  const data = imgData.data;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      const a = data[row + x * 4 + 3];
      if (a > threshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    // nothing non-transparent; return whole image
    return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1, cx: w / 2, cy: h / 2, width: w, height: h };
  }
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  return { minX, minY, maxX, maxY, width, height, cx: minX + width / 2, cy: minY + height / 2 };
}

/**
 * Center an image by its non-transparent content, pad to square.
 * @param {ImageBitmap} bmp
 * @param {number} marginScale 0..1  (how much of the square the content may occupy)
 * @param {'transparent'|string} bgColor
 * @returns {Blob} PNG
 */
async function centerPadToSquarePNG(bmp, marginScale = 0.92, bgColor = 'transparent') {
  const w = bmp.width, h = bmp.height;
  // read alpha
  const tmp = new OffscreenCanvas(w, h);
  const tctx = tmp.getContext('2d');
  tctx.drawImage(bmp, 0, 0);
  const bounds = getAlphaBoundsFromImageData(tctx.getImageData(0, 0, w, h), w, h);

  // target square
  const side = Math.max(w, h);
  const out = new OffscreenCanvas(side, side);
  const octx = out.getContext('2d');
  if (bgColor !== 'transparent') {
    octx.fillStyle = bgColor;
    octx.fillRect(0, 0, side, side);
  }

  // scale so the **content bounds** (not whole image) fit inside margin
  const avail = side * marginScale;
  const r = Math.min(avail / bounds.width, avail / bounds.height);

  const destW = w * r;
  const destH = h * r;

  // map the content centroid to canvas center
  const dx = side / 2 - bounds.cx * r;
  const dy = side / 2 - bounds.cy * r;

  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(bmp, 0, 0, w, h, dx, dy, destW, destH);

  return await out.convertToBlob({ type: 'image/png' });
}

/**
 * Build a pretty 1024 branded preview (JPEG) with gradient, centered by content.
 */
async function buildBrandedPreviewJPEG(bmp, theme = 'lavender', marginScale = 0.90) {
  const side = 1024;
  const out = new OffscreenCanvas(side, side);
  const ctx = out.getContext('2d');

  // soft theme background
  const grd = ctx.createLinearGradient(0, 0, 0, side);
  if (theme === 'lavender') {
    grd.addColorStop(0, '#f4e9ff');
    grd.addColorStop(1, '#f0eaff');
  } else if (theme === 'blush') {
    grd.addColorStop(0, '#ffe9f0');
    grd.addColorStop(1, '#ffeef4');
  } else {
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(1, '#f8f8f8');
  }
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, side, side);

  // center by content bounds again
  const w = bmp.width, h = bmp.height;
  const tmp = new OffscreenCanvas(w, h);
  const tctx = tmp.getContext('2d');
  tctx.drawImage(bmp, 0, 0);
  const b = getAlphaBoundsFromImageData(tctx.getImageData(0, 0, w, h), w, h);

  const avail = side * marginScale;
  const r = Math.min(avail / b.width, avail / b.height);
  const destW = w * r;
  const destH = h * r;
  const dx = side / 2 - b.cx * r;
  const dy = side / 2 - b.cy * r;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h, dx, dy, destW, destH);

  return await out.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
}

// ---------- tiny helpers (existing) ----------
export async function blobToImage(blob) {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  return img;
}
export function canvasToPngBlob(c) {
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}
function canvasToJpegBlob(c, q = 0.9) {
  return new Promise((res) => c.toBlob((b) => res(b), "image/jpeg", q));
}
function downscaleTo(img, maxEdge = 1600) {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const W = Math.max(1, Math.round(img.width * scale));
  const H = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, H);
  return c;
}
function removeBackgroundQuick(sourceCanvas, { whiteThresh = 245, feather = 1 } = {}) {
  const { width: W, height: H } = sourceCanvas;
  const ctx = sourceCanvas.getContext("2d");
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const avg = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    return avg >= whiteThresh && chroma < 18;
  };

  for (let i = 0; i < data.length; i += 4) {
    if (isBg(i)) data[i + 3] = 0;
  }

  if (feather > 0) {
    const out = new Uint8ClampedArray(data);
    const stride = W * 4;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * stride + x * 4;
        if (data[i + 3] > 0) {
          const n =
            data[i - 4 + 3] + data[i + 4 + 3] +
            data[i - stride + 3] + data[i + stride + 3];
          if (n < 4 * 255) out[i + 3] = Math.round((data[i + 3] * 3 + n / 4) / 4);
        }
      }
    }
    ctx.putImageData(new ImageData(out, W, H), 0, 0);
  } else {
    ctx.putImageData(imgData, 0, 0);
  }
  return sourceCanvas;
}
function composeOnBrand(cutoutCanvas, {
  size = 1024, theme = "lavender", padToSquare = true, dropShadow = true
} = {}) {
  const PALETTES = {
    lavender: ["#F6F1FA", "#E9D8F2"],
    sky:      ["#EAF7FF", "#84D2F6"],
    cream:    ["#FFF7E2", "#FFEAB4"],
  };
  const [c0, c1] = PALETTES[theme] || PALETTES.lavender;
  const W = padToSquare ? size : cutoutCanvas.width;
  const H = padToSquare ? size : cutoutCanvas.height;
  const bg = document.createElement("canvas");
  bg.width = W; bg.height = H;
  const ctx = bg.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (dropShadow) {
    ctx.save();
    ctx.filter = "blur(16px)";
    ctx.globalAlpha = 0.35;
    const sx = (W - cutoutCanvas.width) / 2 + 6;
    const sy = (H - cutoutCanvas.height) / 2 + 12;
    ctx.drawImage(cutoutCanvas, sx, sy);
    ctx.restore();
  }
  const x = (W - cutoutCanvas.width) / 2;
  const y = (H - cutoutCanvas.height) / 2;
  ctx.drawImage(cutoutCanvas, x, y);
  return bg;
}

// Icon renderer (transparent 500x500; hover adds baked shadow & slight scale)
function renderIcon(cutoutCanvas, { size = 500, hover = false } = {}) {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  const maxW = Math.round(size * 0.9);
  const maxH = Math.round(size * 0.9);
  const scale = Math.min(maxW / cutoutCanvas.width, maxH / cutoutCanvas.height);
  const w = Math.round(cutoutCanvas.width * scale * (hover ? 1.05 : 1));
  const h = Math.round(cutoutCanvas.height * scale * (hover ? 1.05 : 1));
  const x = Math.round((size - w) / 2);
  const y = Math.round((size - h) / 2);

  if (hover) {
    ctx.save();
    ctx.shadowColor = "rgba(20,33,54,0.35)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(cutoutCanvas, x, y, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(cutoutCanvas, x, y, w, h);
  }
  return c;
}

// ----- server pro remover (callable) -----
async function blobToBase64(blob) {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToBlob(b64, mime = "image/png") {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
export async function removeBackgroundProPNG(blob) {
  const fns = getFunctions(app);
  const call = httpsCallable(fns, "removeBgPro");
  const imageBase64 = await blobToBase64(blob);
  const { data } = await call({ imageBase64 });
  if (!data?.ok || !data?.imageBase64) return null;
  return base64ToBlob(data.imageBase64, "image/png");
}

// ============================================================================
// NEW: processImageBlob (paper/centering + theme-aware), per your spec
// ============================================================================

/** Quick bytes -> ImageBitmap */
async function loadBitmap(blob) {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const url = URL.createObjectURL(new Blob([bytes], { type: blob.type || "image/png" }));
  const img = await createImageBitmap(await fetch(url).then(r => r.blob()));
  URL.revokeObjectURL(url);
  return img;
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

/** Scan alpha to get bounds + centroid (alpha-weighted) */
function alphaStats(imgBitmap) {
  const c = makeCanvas(imgBitmap.width, imgBitmap.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(imgBitmap, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);

  let minX = width, minY = height, maxX = -1, maxY = -1;
  let sumAx = 0, sumAy = 0, sumA  = 0;
  const TH = 8; // alpha threshold

  for (let y = 0; y < height; y++) {
    let row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const a = data[row + x*4 + 3];
      if (a > TH) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        sumAx += a * x;
        sumAy += a * y;
        sumA  += a;
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    // no alpha content; treat whole image
    minX = 0; minY = 0; maxX = width - 1; maxY = height - 1;
    return { minX, minY, maxX, maxY, cx: width/2, cy: height/2, width, height };
  }

  const cx = sumA > 0 ? sumAx / sumA : (minX + maxX) / 2;
  const cy = sumA > 0 ? sumAy / sumA : (minY + maxY) / 2;
  return { minX, minY, maxX, maxY, cx, cy, width, height };
}

function deg2rad(d) { return (d * Math.PI) / 180; }

/** Paint the “paper” background */
function paintPaper(ctx, W, H, theme) {
  const radius = theme.radius ?? 20;
  const shadow = theme.shadow ?? 10;

  ctx.save();
  // soft outer backdrop
  ctx.shadowColor = "rgba(0,0,0,.10)";
  ctx.shadowBlur = shadow;
  ctx.shadowOffsetY = Math.max(2, Math.round(shadow / 3));

  // rounded rect clip
  const r = radius;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(W - r, 0); ctx.quadraticCurveTo(W, 0, W, r);
  ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
  ctx.lineTo(r, H);     ctx.quadraticCurveTo(0, H, 0, H - r);
  ctx.lineTo(0, r);     ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  // inner gradient/solid
  ctx.shadowColor = "transparent";
  ctx.clip();

  if (theme.type === "solid") {
    ctx.fillStyle = (theme.colors && theme.colors[0]) || "#ffffff";
    ctx.fillRect(0, 0, W, H);
  } else {
    const ang = deg2rad(theme.angle ?? 90);
    const cx = W/2, cy = H/2;
    const rx = Math.cos(ang), ry = Math.sin(ang);
    const L = Math.max(W, H) * 0.75;
    const g = ctx.createLinearGradient(cx - rx*L, cy - ry*L, cx + rx*L, cy + ry*L);
    const cols = theme.colors?.length ? theme.colors : ["#fafafa", "#f1f1f1"];
    if (cols.length === 1) { g.addColorStop(0, cols[0]); g.addColorStop(1, cols[0]); }
    else {
      const n = cols.length;
      cols.forEach((c, i) => g.addColorStop(i/(n-1), c));
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** Draw the cutout centered & scaled to margin on top of paper */
function drawCentered(ctx, cutout, stats, W, H, theme) {
  const PAD = Math.max(0, Math.min(0.45, theme.marginPct ?? 0.1)); // clamp 0..0.45
  const biasY = theme.biasY ?? 0.0;

  const bw = (stats.maxX - stats.minX + 1);
  const bh = (stats.maxY - stats.minY + 1);

  const maxW = W * (1 - PAD*2);
  const maxH = H * (1 - PAD*2);
  const scale = Math.min(maxW / bw, maxH / bh);

  const dstCx = W / 2;
  const dstCy = H / 2 + H * biasY;

  const dx = dstCx - stats.cx * scale;
  const dy = dstCy - stats.cy * scale;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(cutout, 0, 0, cutout.width, cutout.height, dx, dy, cutout.width * scale, cutout.height * scale);
}

/** export canvas to Blob */
async function toBlob(canvas, type = "image/png", quality) {
  return new Promise((res) => canvas.toBlob((b) => res(b), type, quality));
}

/**
 * PROCESSOR:
 * - returns { cutoutBlob, previewBlob, previewUrl, iconBlob, iconHoverBlob }
 * - respects UI options, including themeId / theme name
 */
export async function processImageBlob(inputBlob, {
  smartCompress = true,
  trimBg = true,           // assume your remover already did this (transparent bg)
  padToSquare = true,      // we will stage on a square paper anyway
  previewTheme = "Lavender",
  preferServer = true,     // untouched; kept for your clipdrop/removebg flow
  exportPreview = true,
  exportIcon = true,
  exportIconHover = true,
} = {}) {
  // 0) Remove background with Cloud Function (fallback to original if it fails)
  let cutoutBlob = inputBlob;
  if (preferServer) {
    try {
      cutoutBlob = await serverRemoveBackground(inputBlob);
      } catch (e) {
        console.warn("[pipeline] server removeBg failed; using original image", e);
        }
        }

  // 1) Compute stats on the cutout
  const bmp = await loadBitmap(cutoutBlob);
  const stats = alphaStats(bmp);

  // 2) Resolve theme (admin/creator aware)
  const uid = auth.currentUser?.uid || null;
  let theme = BUILTIN_THEMES[previewTheme] || BUILTIN_THEMES.Lavender;
  try {
    if (uid) theme = await getEffectiveThemeForUser(uid, previewTheme);
  } catch {}

  // 3) Build paper preview 1024 x 1024
  let previewBlob = null, previewUrl = "";
  if (exportPreview) {
    const W = 1024, H = 1024;
    const c = makeCanvas(W, H);
    const ctx = c.getContext("2d");
    paintPaper(ctx, W, H, theme);
    drawCentered(ctx, bmp, stats, W, H, theme);
    previewBlob = await toBlob(c, "image/jpeg", 0.92);
    previewUrl = URL.createObjectURL(previewBlob);
  }

  // 4) Square centered cutout (transparent)
  const SQ = Math.max(bmp.width, bmp.height);
  const c2 = makeCanvas(SQ, SQ);
  const ctx2 = c2.getContext("2d");
  drawCentered(ctx2, bmp, stats, SQ, SQ, { marginPct: 0.0, biasY: 0.0 });
  const centeredCutoutBlob = await toBlob(c2, "image/png");

  // 5) Icons (256 px)
  let iconBlob = null, iconHoverBlob = null;
  if (exportIcon || exportIconHover) {
    const W = 256, H = 256;
    const c = makeCanvas(W, H);
    const ctx = c.getContext("2d");
    // base (lighter shadow/radius for crispness)
    paintPaper(ctx, W, H, { ...theme, shadow: Math.min(6, theme.shadow || 8), radius: Math.min(12, theme.radius || 16) });
    drawCentered(ctx, bmp, stats, W, H, theme);
    if (exportIcon) iconBlob = await toBlob(c, "image/png");

    if (exportIconHover) {
      const cH = makeCanvas(W, H);
      const ctxH = cH.getContext("2d");
      paintPaper(ctxH, W, H, { ...theme, shadow: (theme.shadow || 10) + 6 });
      ctxH.filter = "saturate(1.06)";
      drawCentered(ctxH, bmp, stats, W, H, theme);
      iconHoverBlob = await toBlob(cH, "image/png");
    }
  }

  return {
    cutoutBlob: centeredCutoutBlob,
    previewBlob,
    previewUrl,
    iconBlob,
    iconHoverBlob,
  };
}
