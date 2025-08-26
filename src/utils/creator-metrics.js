import { httpsCallable } from "firebase/functions";
import { functions } from "@/utils/init-firebase";

/**
 * Log a board event that should increment creator metrics.
 * type: "view" | "save" | "click" | "share"
 * payload: { creatorUid, boardId, itemId?, category?, boardLabel?, outUrl? }
 * We also attach local timezone context for heatmaps.
 */
export async function trackBoardEvent(type, payload = {}) {
  const fn = httpsCallable(functions, "boardsTrackEvent");

  // Local timezone context (for per-hour local heatmap)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const tzOffsetMinutes = new Date().getTimezoneOffset(); // UTC - local (mins)

  try {
    await fn({ type, ...payload, tz, tzOffsetMinutes });
  } catch (e) {
    // do not break UX
    console.warn("[metrics] trackBoardEvent failed", e);
  }
}

/** Specific helpers (optional) */
export const trackBoardView  = (p) => trackBoardEvent("view",  p);
export const trackBoardSave  = (p) => trackBoardEvent("save",  p);
export const trackBoardShare = (p) => trackBoardEvent("share", p);

/** Outbound click: we’ll parse host/path server-side */
export function trackOutboundClick({ creatorUid, boardId, itemId, category, boardLabel, url }) {
  return trackBoardEvent("click", {
    creatorUid,
    boardId,
    itemId,
    category,
    boardLabel,
    outUrl: url,
  });
}
