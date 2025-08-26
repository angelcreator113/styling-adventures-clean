/* eslint-disable camelcase */
const functions = require("firebase-functions/v1"); // v1 compat
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/* ----------------------------- helpers ----------------------------- */
function todayKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
function slugify(s) {
  s = String(s || "");
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
function isLikelyBase64(str) {
  return typeof str === "string" && /^[A-Za-z0-9+/=\s]+$/.test(str) && str.length > 0;
}
function approxBytesFromBase64(b64) {
  const len = b64.length - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);
  return Math.floor((len * 3) / 4);
}
function adminDailyDoc(dateKey) {
  return db.collection("admin").doc("metrics").collection("boards_daily").doc(dateKey);
}

/* =================================================================== */
/* DEV-ONLY: grant admin on new users (gated by env)                    */
/* =================================================================== */
const ENABLE_DEV_ADMIN = process.env.ENABLE_DEV_ADMIN === "true";
if (ENABLE_DEV_ADMIN) {
  exports.processNewUser = functions.auth.user().onCreate(async (user) => {
    const uid = user.uid;
    const email = user.email || "";

    await admin.auth().setCustomUserClaims(uid, { admin: true });

    await db.collection("users").doc(uid).set(
      {
        email: email,
        createdAt: FieldValue.serverTimestamp(),
        isAdmin: true,
      },
      { merge: true }
    );

    console.log("User " + uid + " initialized with admin + profile doc.");
  });
}

/* =================================================================== */
/* ✅ NEW: Admin-only callable to set roles (and optional spaces cap)   */
/* =================================================================== */
/**
 * data: { email: string, role: 'fan'|'creator'|'admin', spacesCap?: number }
 * only callable by an admin (custom claims admin=true OR role==='admin')
 */
exports.setUserRole = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // Auth + admin gate
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }
    const claims = context.auth.token || {};
    const isAdmin = claims.admin === true || claims.role === "admin";
    if (!isAdmin) {
      throw new functions.https.HttpsError("permission-denied", "Admins only");
    }

    const VALID = new Set(["fan", "creator", "admin"]);
    const email = String(data?.email || "").trim().toLowerCase();
    const role = String(data?.role || "");
    const spacesCap =
      data?.spacesCap === undefined ? undefined : Number(data.spacesCap);

    if (!email || !VALID.has(role)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid email or role");
    }
    if (role === "creator" && spacesCap !== undefined) {
      if (!Number.isFinite(spacesCap) || spacesCap < 0) {
        throw new functions.https.HttpsError("invalid-argument", "spacesCap must be >= 0");
      }
    }

    // Lookup user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    // Build next claims (preserve existing)
    const nextClaims = { ...(userRecord.customClaims || {}), role };
    if (role === "admin") nextClaims.admin = true;
    else if ("admin" in nextClaims) delete nextClaims.admin;

    await admin.auth().setCustomUserClaims(userRecord.uid, nextClaims);

    // Optional cap for creators (stored in profile)
    if (role === "creator" && spacesCap !== undefined) {
      await db
        .doc(`users/${userRecord.uid}/settings/profile`)
        .set({ spacesCap }, { merge: true });
    }

    return { ok: true, uid: userRecord.uid, role, spacesCap: spacesCap ?? null };
  });

/* =================================================================== */
/* Callable: Pro background removal                                     */
/* =================================================================== */
exports.removeBgPro = functions
  .region("us-central1")
  .runWith({ memory: "2GB", timeoutSeconds: 60, secrets: ["REMOVER_KEY"] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }

    const imageBase64 = data && data.imageBase64;
    if (!imageBase64) {
      throw new functions.https.HttpsError("invalid-argument", "imageBase64 missing");
    }
    if (!isLikelyBase64(imageBase64)) {
      throw new functions.https.HttpsError("invalid-argument", "imageBase64 not valid");
    }
    const maxBytes = 8 * 1024 * 1024; // ~8 MB
    if (approxBytesFromBase64(imageBase64) > maxBytes) {
      throw new functions.https.HttpsError("invalid-argument", "image too large");
    }

    const provider = String(process.env.REMOVER_PROVIDER || "stub").toLowerCase();
    const key = String(process.env.REMOVER_KEY || "");

    console.log("[removeBgPro] provider:", provider, "key?", key ? "yes" : "no");

    try {
      if (provider === "clipdrop" && key) {
        const url = "https://clipdrop-api.co/remove-background/v1";
        const FormData = require("form-data");
        const buffer = Buffer.from(imageBase64, "base64");
        const form = new FormData();
        form.append("image_file", buffer, { filename: "in.png" });

        const resp = await axios.post(url, form, {
          headers: { "x-api-key": key, ...form.getHeaders() },
          responseType: "arraybuffer",
        });
        const outB64 = Buffer.from(resp.data).toString("base64");
        return { ok: true, imageBase64: outB64 };
      }

      if (provider === "removebg" && key) {
        const url = "https://api.remove.bg/v1.0/removebg";
        const FormData = require("form-data");
        const buffer = Buffer.from(imageBase64, "base64");
        const form = new FormData();
        form.append("image_file", buffer, { filename: "in.png" });
        form.append("size", "auto");

        const resp = await axios.post(url, form, {
          headers: { "X-Api-Key": key, ...form.getHeaders() },
          responseType: "arraybuffer",
        });
        const outB64 = Buffer.from(resp.data).toString("base64");
        return { ok: true, imageBase64: outB64 };
      }

      console.warn("removeBgPro running in STUB mode (no provider configured).");
      return { ok: true, imageBase64: imageBase64 };
    } catch (err) {
      let errData = err;
      if (err && err.response && err.response.data) errData = err.response.data;
      console.error("removeBgPro failure:", errData);
      throw new functions.https.HttpsError("internal", "Background removal failed");
    }
  });

/* =================================================================== */
/* Boards Analytics: counters + daily timeseries                        */
/* =================================================================== */
exports.onBoardItemCreate = functions
  .region("us-central1")
  .firestore.document("users/{uid}/boards/{boardId}/items/{itemId}")
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    const boardId = context.params.boardId;
    const data = snap.data() || {};
    const ts = FieldValue.serverTimestamp();
    const dateKey = todayKeyUTC();

    const boardRef = db.collection("users").doc(uid).collection("boards").doc(boardId);
    const dailyRef = adminDailyDoc(dateKey);
    const catLabel = data.category || "";
    const catSlug = slugify(catLabel || "uncategorized");
    const boardDailyRef = dailyRef.collection("boards").doc(uid + ":" + boardId);
    const catDailyRef = dailyRef.collection("categories").doc(catSlug);

    try {
      const br = await boardRef.get();
      const updates = {
        itemsCount: FieldValue.increment(1),
        updatedAt: ts,
      };
      const brData = br.exists ? br.data() : null;
      const hasCover = !!(brData && brData.coverUrl);
      if (!hasCover && data.previewUrl) {
        updates.coverUrl = data.previewUrl;
      }
      await boardRef.set(updates, { merge: true });
    } catch (e) {
      console.error("onBoardItemCreate: boardRef.set failed", e);
    }

    const batch = db.batch();
    batch.set(dailyRef, { added: FieldValue.increment(1), updatedAt: ts }, { merge: true });
    batch.set(
      boardDailyRef,
      { uid: uid, boardId: boardId, label: data.boardLabel || null, added: FieldValue.increment(1) },
      { merge: true }
    );
    batch.set(
      catDailyRef,
      { label: catLabel || "Uncategorized", count: FieldValue.increment(1) },
      { merge: true }
    );
    await batch.commit();
  });

exports.onBoardItemDelete = functions
  .region("us-central1")
  .firestore.document("users/{uid}/boards/{boardId}/items/{itemId}")
  .onDelete(async (_snap, context) => {
    const uid = context.params.uid;
    const boardId = context.params.boardId;
    const ts = FieldValue.serverTimestamp();
    const dateKey = todayKeyUTC();

    const boardRef = db.collection("users").doc(uid).collection("boards").doc(boardId);
    const dailyRef = adminDailyDoc(dateKey);
    const boardDailyRef = dailyRef.collection("boards").doc(uid + ":" + boardId);

    try {
      await db.runTransaction(async (t) => {
        const snap = await t.get(boardRef);
        const cur = (snap.exists && snap.data().itemsCount) || 0;
        const next = Math.max(0, cur - 1);
        t.set(
          boardRef,
          {
            itemsCount: next,
            updatedAt: ts,
          },
          { merge: true }
        );
      });
    } catch (e) {
      console.error("onBoardItemDelete: transaction failed", e);
    }

    const batch = db.batch();
    batch.set(dailyRef, { removed: FieldValue.increment(1), updatedAt: ts }, { merge: true });
    batch.set(
      boardDailyRef,
      { uid: uid, boardId: boardId, removed: FieldValue.increment(1) },
      { merge: true }
    );
    await batch.commit();
  });

/* =================================================================== */
/* Optional: HTTP viewer to inspect a daily snapshot quickly (admin)    */
/* =================================================================== */
exports.boardsDaily = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    try {
      const requiredToken = process.env.ADMIN_METRICS_TOKEN;
      if (requiredToken) {
        const provided = req.get("x-admin-token");
        if (provided !== requiredToken) {
          res.status(403).json({ ok: false, error: "forbidden" });
          return;
        }
      }

      const dateKey = (req.query && req.query.date) ? String(req.query.date) : todayKeyUTC();
      const docRef = adminDailyDoc(dateKey);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        res.status(404).json({ ok: false, message: "No metrics for date", dateKey: dateKey });
        return;
      }
      const out = docSnap.data() || {};
      const catsSnap = await docRef.collection("categories").get();
      const boardsSnap = await docRef.collection("boards").get();
      out.categories = catsSnap.docs.map(function(d) {
        return Object.assign({ id: d.id }, d.data());
      });
      out.boards = boardsSnap.docs.map(function(d) {
        return Object.assign({ id: d.id }, d.data());
      });
      res.json({ ok: true, dateKey: dateKey, data: out });
    } catch (e) {
      console.error("boardsDaily error", e);
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

/* =================================================================== */
/* Creator events → per-creator daily counters                          */
/* =================================================================== */
exports.boardsTrackEvent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }
    const p = data || {};
    const type = p.type;
    const creatorUid = p.creatorUid;
    const boardId = p.boardId;
    const category = p.category;
    const boardLabel = p.boardLabel;
    const outUrl = p.outUrl;

    const tz = String(p.tz || "UTC");
    const tzOffsetMinutes = Number.isFinite(p.tzOffsetMinutes) ? Number(p.tzOffsetMinutes) : 0;

    const allowed = new Set(["view", "save", "click", "share"]);
    if (!allowed.has(type) || !creatorUid || !boardId) {
      throw new functions.https.HttpsError("invalid-argument", "Bad payload");
    }

    const now = new Date();
    const dateKey = todayKeyUTC(now);
    const utcHour = now.getUTCHours();
    const localHour = ((utcHour - (tzOffsetMinutes / 60)) % 24 + 24) % 24;
    const hourDocKey = String(utcHour).padStart(2, "0");
    const localHourDocKey = String(localHour).padStart(2, "0");

    const ts = FieldValue.serverTimestamp();

    const dailyRef = db.doc("users/" + creatorUid + "/metrics/boards/daily/" + dateKey);
    const boardsRef = dailyRef.collection("boards").doc(boardId);
    const catSlug = slugify(category || "uncategorized");
    const catsRef = dailyRef.collection("categories").doc(catSlug);
    const utcHourRef = dailyRef.collection("hours").doc(hourDocKey);
    const localHourRef = dailyRef.collection("local_hours").doc(localHourDocKey);

    const inc = function(f) {
      const o = {}; o[f] = FieldValue.increment(1); return o;
    };

    const batch = db.batch();

    const totalsUpdate = { updatedAt: ts, tz, tzOffsetMinutes };
    if (type === "view") Object.assign(totalsUpdate, inc("views"));
    if (type === "save") Object.assign(totalsUpdate, inc("saves"));
    if (type === "click") Object.assign(totalsUpdate, inc("clicks"));
    if (type === "share") Object.assign(totalsUpdate, inc("shares"));
    batch.set(dailyRef, totalsUpdate, { merge: true });

    const boardUpdate = { updatedAt: ts, boardId: boardId, label: boardLabel || null };
    if (type === "view") boardUpdate.views = FieldValue.increment(1);
    if (type === "save") boardUpdate.saves = FieldValue.increment(1);
    if (type === "click") boardUpdate.clicks = FieldValue.increment(1);
    if (type === "share") boardUpdate.shares = FieldValue.increment(1);
    batch.set(boardsRef, boardUpdate, { merge: true });

    if (category) {
      batch.set(catsRef, { label: category, count: FieldValue.increment(1) }, { merge: true });
    }

    const utcUpdate = { updatedAt: ts };
    if (type === "view") utcUpdate.views = FieldValue.increment(1);
    if (type === "save") utcUpdate.saves = FieldValue.increment(1);
    if (type === "click") utcUpdate.clicks = FieldValue.increment(1);
    if (type === "share") utcUpdate.shares = FieldValue.increment(1);
    batch.set(utcHourRef, utcUpdate, { merge: true });

    const localUpdate = { updatedAt: ts, tz, tzOffsetMinutes };
    if (type === "view") localUpdate.views = FieldValue.increment(1);
    if (type === "save") localUpdate.saves = FieldValue.increment(1);
    if (type === "click") localUpdate.clicks = FieldValue.increment(1);
    if (type === "share") localUpdate.shares = FieldValue.increment(1);
    batch.set(localHourRef, localUpdate, { merge: true });

    if (type === "click" && outUrl) {
      try {
        const u = new URL(String(outUrl));
        const host = u.hostname.replace(/^www\./i, "");
        const path = u.pathname || "/";
        const hostId = Buffer.from(host).toString("base64").slice(0, 100);
        batch.set(
          dailyRef.collection("links").doc(hostId),
          { host, clicks: FieldValue.increment(1) },
          { merge: true }
        );
        const fullKey = host + "|" + path;
        const fullId = Buffer.from(fullKey).toString("base64").slice(0, 140);
        batch.set(
          dailyRef.collection("links_full").doc(fullId),
          { host, path, clicks: FieldValue.increment(1) },
          { merge: true }
        );
      } catch (_e) {
        // ignore bad URLs
      }
    }

    await batch.commit();
    return { ok: true };
  });
