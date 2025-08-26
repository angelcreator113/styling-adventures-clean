// src/utils/board-helpers.js
import { db } from "@/utils/init-firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

/* --------------------------- utils --------------------------- */
const slugify = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

function randId(n = 12) {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < n; i++) out += abc[Math.floor(Math.random() * abc.length)];
  return out;
}

/** App route for public board viewer (current router form). */
export const sharePathFor = (uid, boardId) => `/b/${uid}/${boardId}`;

/* ============================================================= */
/* Watchers                                                      */
/* ============================================================= */

/**
 * Safe boards watcher — waits for uid; sorted by updatedAt desc.
 * Returns an unsubscribe function (no-op if not subscribed).
 */
export function watchMyBoards(uid, onUpdate, onError) {
  if (!uid) return () => {}; // guard until auth is ready

  const boardsCol = collection(db, `users/${uid}/boards`);
  let qy;
  try {
    qy = query(boardsCol, orderBy("updatedAt", "desc"));
  } catch (_e) {
    // if index/field missing, fallback to unordered
    qy = boardsCol;
  }

  const off = onSnapshot(
    qy,
    (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate?.(arr);
    },
    (err) => {
      onError?.(err);
      console.warn("[watchMyBoards] onSnapshot error:", err);
    }
  );
  return off;
}

/** Back-compat alias */
export const listenBoards = (uid, cb) => watchMyBoards(uid, cb);

/** Watch a board’s items (owner view). Orders by `order` asc, then `addedAt`. */
export function watchBoardItems(uid, boardId, onUpdate, onError) {
  if (!uid || !boardId) return () => {};

  const colRef = collection(db, `users/${uid}/boards/${boardId}/items`);
  let qy;
  try {
    qy = query(colRef, orderBy("order", "asc"));
  } catch (_e) {
    try {
      qy = query(colRef, orderBy("addedAt", "desc"));
    } catch (_e2) {
      qy = colRef;
    }
  }
  return onSnapshot(
    qy,
    (snap) => onUpdate?.(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}

/** Public viewer: read a board if visibility is public. */
export async function getPublicBoard(uid, boardId) {
  const ref = doc(db, `users/${uid}/boards/${boardId}`);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  const d = s.data();
  const isPublic =
    d?.visibility === "public" || (typeof d?.public === "boolean" && d.public);
  if (!isPublic) return null;
  return { id: s.id, ...d };
}

/** Public viewer: watch items of a public board (read-only). */
export function watchPublicBoardItems(uid, boardId, onUpdate, onError) {
  const colRef = collection(db, `users/${uid}/boards/${boardId}/items`);
  let qy;
  try {
    qy = query(colRef, orderBy("order", "asc"));
  } catch (_e) {
    try {
      qy = query(colRef, orderBy("addedAt", "desc"));
    } catch (_e2) {
      qy = colRef;
    }
  }
  return onSnapshot(
    qy,
    (snap) => onUpdate?.(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}

/* ============================================================= */
/* Board CRUD                                                    */
/* ============================================================= */

export async function getBoard(uid, boardId) {
  const ref = doc(db, `users/${uid}/boards/${boardId}`);
  const s = await getDoc(ref);
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function ensureBoard(uid, key, label, opts = {}) {
  const id = slugify(key);
  const ref = doc(db, `users/${uid}/boards/${id}`);
  const got = await getDoc(ref);
  if (!got.exists()) {
    await setDoc(ref, {
      uid,
      key: id,
      label: label || key,
      locked: !!opts.locked,
      public: false,
      visibility: "private", // dual-write for compatibility
      shareId: randId(12),
      coverUrl: opts.coverUrl || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      itemsCount: 0,
    });
  }
  return id;
}

export async function renameBoard(uid, boardId, newLabel) {
  const ref = doc(db, `users/${uid}/boards/${boardId}`);
  await updateDoc(ref, { label: newLabel, updatedAt: serverTimestamp() });
}

export async function deleteBoard(uid, boardId) {
  const itemsCol = collection(db, `users/${uid}/boards/${boardId}/items`);
  const itemsSnap = await getDocs(itemsCol);
  const batch = writeBatch(db);
  itemsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, `users/${uid}/boards/${boardId}`));
  await batch.commit();
}

/** Toggle public/private; returns { shareId, sharePath }. */
export async function setBoardPublic({ uid, boardId, publicOn }) {
  const ref = doc(db, `users/${uid}/boards/${boardId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const shareId = snap.data()?.shareId || randId(12);
  const visibility = publicOn ? "public" : "private";

  await updateDoc(ref, {
    public: !!publicOn,
    visibility,
    shareId,
    updatedAt: serverTimestamp(),
  });

  return { shareId, sharePath: sharePathFor(uid, boardId) };
}

/* ============================================================= */
/* Items: add / remove / reorder                                 */
/* ============================================================= */

export async function addItemToBoard({
  uid,
  boardId,
  itemId,
  previewUrl = "",
  category = "",
}) {
  const boardRef = doc(db, `users/${uid}/boards/${boardId}`);
  const board = await getDoc(boardRef);
  if (!board.exists()) return;

  const itemsCol = collection(db, `users/${uid}/boards/${boardId}/items`);

  // de-dupe by source itemId
  const qy = query(itemsCol, where("itemId", "==", itemId), limit(1));
  const snap = await getDocs(qy);
  if (!snap.empty) return;

  const nowOrder = Date.now(); // ascending for manual reorder later
  await addDoc(itemsCol, {
    itemId,
    previewUrl,
    category,
    addedAt: serverTimestamp(),
    order: nowOrder,
  });

  // first image becomes cover
  if (!board.data()?.coverUrl && previewUrl) {
    await updateDoc(boardRef, {
      coverUrl: previewUrl,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function removeItemFromBoard({ uid, boardId, boardItemId }) {
  await deleteDoc(doc(db, `users/${uid}/boards/${boardId}/items/${boardItemId}`));
}

export async function reorderBoardItems({ uid, boardId, orderedItemDocIds = [] }) {
  const batch = writeBatch(db);
  const base = Date.now();
  orderedItemDocIds.forEach((docId, i) => {
    const r = doc(db, `users/${uid}/boards/${boardId}/items/${docId}`);
    batch.update(r, { order: base + i });
  });
  await batch.commit();
}

/* ============================================================= */
/* Auto-curation on upload                                       */
/* ============================================================= */

export async function ensureDefaultBoards(uid) {
  await ensureBoard(uid, "just-in", "Just In", { locked: true });
}

/**
 * Auto-curate newly uploaded item into "Just In" and (optionally) category board.
 * Controlled by users/{uid}/settings/boards { autoByCategory: boolean } (default true).
 */
export async function autoCurateOnUpload({
  uid,
  itemId,
  category = "",
  previewUrl = "",
}) {
  if (!uid || !itemId) return;

  // Always ensure & add to Just In
  await ensureDefaultBoards(uid);
  await addItemToBoard({
    uid,
    boardId: "just-in",
    itemId,
    previewUrl,
    category,
  });

  // Check user setting
  const settingsRef = doc(db, `users/${uid}/settings/boards`);
  const st = await getDoc(settingsRef);
  const auto = st.exists() ? !!st.data()?.autoByCategory : true;
  if (!auto || !category) return;

  // Ensure category board and add
  const key = `cat-${slugify(category)}`;
  const label = category;
  const bid = await ensureBoard(uid, key, label);
  await addItemToBoard({ uid, boardId: bid, itemId, previewUrl, category });
}

/** Explicitly set auto-curation preference. */
export async function setAutoCurate(uid, enabled) {
  const settingsRef = doc(db, `users/${uid}/settings/boards`);
  await setDoc(
    settingsRef,
    { autoByCategory: !!enabled, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
