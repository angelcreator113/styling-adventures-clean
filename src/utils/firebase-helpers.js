// src/utils/firebase-helpers.js
import { storage, db, auth } from "./init-firebase.js";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";

/* ------------------------------------ *
 * helpers
 * ------------------------------------ */

// Optional, opt-in DOM events (legacy). Default OFF.
function emit(name, detail, enabled) {
  if (!enabled) return;
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

function normalizePath(p) {
  return String(p || "")
    .replace(/^\/*/, "")   // drop leading slashes
    .replace(/\/*$/, "");  // drop trailing slashes
}

function buildSafeName(file, metadata) {
  const type = metadata?.contentType || file?.type || "image/png";
  const ext = (() => {
    const slash = type.indexOf("/");
    if (slash === -1) return "png";
    const raw = type.slice(slash + 1).toLowerCase();
    if (raw.includes("jpeg")) return "jpg";
    return raw || "png";
  })();

  const incoming =
    (file && typeof file.name === "string" && file.name.trim()) ||
    `upload.${ext}`;

  const hasExt = /\.[a-z0-9]+$/i.test(incoming);

  // Sanitize: spaces -> dashes, remove slashes & control chars
  const base = incoming
    .replace(/[^\S\r\n]+/g, "-")   // whitespace -> dash
    .replace(/[\/\\]+/g, "-")      // no path separators
    .replace(/[\u0000-\u001f]+/g, "") // control chars
    .slice(0, 180); // keep reasonable length

  return hasExt ? base : `${base}.${ext}`;
}

/* ------------------------------------ *
 * low-level upload (Storage only)
 * ------------------------------------ */
export function uploadFile({
  file,
  path,
  uiPrefix,
  metadata = {},
  onProgress,
  emitDomEvents = false,
}) {
  if (!file) throw new Error("uploadFile: 'file' is required");
  if (!path) throw new Error("uploadFile: 'path' is required");

  const safeBase = normalizePath(path);

  return new Promise((resolve, reject) => {
    const safeName = buildSafeName(file, metadata);
    const fullPath = `${safeBase}/${Date.now()}-${safeName}`;
    const sref = ref(storage, fullPath);
    const task = uploadBytesResumable(sref, file, metadata);

    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.max(0, Math.min(100, (snap.bytesTransferred / snap.totalBytes) * 100 || 0));
        onProgress?.(pct, snap.bytesTransferred, snap.totalBytes);
        emit(
          "upload:progress",
          {
            uiPrefix,
            progress: pct,
            bytesTransferred: snap.bytesTransferred,
            totalBytes: snap.totalBytes,
            fileName: safeName,
            path: fullPath,
          },
          emitDomEvents
        );
      },
      (error) => {
        emit(
          "upload:error",
          { uiPrefix, error: String(error), fileName: safeName, path: fullPath },
          emitDomEvents
        );
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        emit(
          "upload:complete",
          { uiPrefix, url, fileName: safeName, path: fullPath },
          emitDomEvents
        );
        resolve({
          url,
          fullPath,
          bytes: task.snapshot.totalBytes,
          contentType:
            metadata?.contentType || file?.type || "application/octet-stream",
          fileName: safeName,
        });
      }
    );
  });
}

/* ------------------------------------ *
 * high-level upload (plus optional doc)
 * ------------------------------------ */
/**
 * Uploads a file to Storage and (optionally) writes a Firestore doc.
 *
 * Options:
 * - slug: "spaces" | "closet" | "voice" | "episodes" (used if pathPrefix not provided)
 * - pathPrefix: full Storage base (e.g. "images/users/UID/spaces/SPACE_ID")
 * - storageFolder: simple folder under "images/users/UID" (e.g. "spaces")
 * - derivedSubfolder: folder for derivatives (default "derived")
 * - extraUploads: [{ key, blob, contentType }]
 * - writeToFirestore: boolean (default false)
 * - collectionPath: Firestore collection path if writing a doc
 * - metadata: extra metadata (include spaceId when slug === "spaces")
 */
export async function uploadFileWithProgress(
  file,
  {
    slug,
    public: isPublic = true,
    onProgress,
    uiPrefix,
    metadata = {},
    extraUploads,
    pathPrefix,                 // overrides everything if provided
    storageFolder,              // simple folder under images/users/UID
    derivedSubfolder = "derived",
    writeToFirestore = false,   // default off — caller writes its own doc
    collectionPath,             // where to write a doc if writeToFirestore = true
  }
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const meta = {
    ...(isPublic ? { cacheControl: "public,max-age=31536000" } : {}),
    ...metadata,
  };

  // Resolve Storage base path (supports Spaces)
  let basePath = normalizePath(
    pathPrefix ||
      (storageFolder
        ? `images/users/${user.uid}/${storageFolder}`
        : slug === "closet"
        ? `images/users/${user.uid}/closet`
        : slug === "voice"
        ? `images/users/${user.uid}/voice`
        : slug === "spaces"
        ? (() => {
            const sid = meta.spaceId;
            if (!sid) {
              // Force caller to provide spaceId or pathPrefix
              throw new Error(
                "uploadFileWithProgress('spaces'): metadata.spaceId is required when pathPrefix is not provided"
              );
            }
            return `images/users/${user.uid}/spaces/${sid}`;
          })()
        : `images/users/${user.uid}/episodes`)
  );

  // 1) Main upload (no DOM events)
  const up = await uploadFile({
    file,
    path: basePath,
    uiPrefix,
    onProgress,
    metadata: meta,
    emitDomEvents: false,
  });

  // 2) Derivative uploads (no DOM events)
  let assets = {};
  if (extraUploads?.length) {
    const derivedPath = `${basePath}/${normalizePath(derivedSubfolder)}`;
    for (const item of extraUploads) {
      if (!item?.blob || !item?.key) continue;
      const res = await uploadFile({
        file: item.blob,
        path: derivedPath,
        uiPrefix,
        metadata: {
          contentType: item.contentType || "application/octet-stream",
          cacheControl: "public,max-age=31536000",
        },
        emitDomEvents: false,
      });
      assets[item.key] = {
        url: res.url,
        path: res.fullPath,
        contentType: res.contentType,
        bytes: res.bytes,
        fileName: res.fileName,
      };
    }
  }

  // Caller handles Firestore (recommended for Spaces)
  if (!writeToFirestore) {
    return { ...up, assets };
  }

  // 3) Optional Firestore write (legacy / opt-in)
  const colPath =
    collectionPath ||
    (slug === "closet"
      ? `users/${user.uid}/closet`
      : slug === "voice"
      ? "voice"
      : slug === "spaces"
      ? `users/${user.uid}/spaces/${meta.spaceId || "default"}/items`
      : "episodes");

  const visibility =
    (document.getElementById(`${uiPrefix}feat-public`)?.checked ??
      document.getElementById(`${uiPrefix}is-public`)?.checked ??
      true)
      ? "public"
      : "private";

  const title =
    meta.title ||
    document.getElementById(`${uiPrefix}title`)?.value?.trim() ||
    "";

  const data = {
    uid: user.uid,
    slug,
    visibility,
    path: up.fullPath,
    storagePath: up.fullPath,
    url: up.url,
    fileName: up.fileName,
    contentType: up.contentType,
    bytes: up.bytes,
    title,
    assets,
    source: "manual",
    uploadedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const clientUploadId = meta.clientUploadId;
  if (clientUploadId) {
    const docRef = doc(db, colPath, clientUploadId);
    await setDoc(docRef, data, { merge: true });
    return { ...up, docRef, docId: clientUploadId, assets };
  } else {
    const docRef = await addDoc(collection(db, colPath), data);
    return { ...up, docRef, docId: docRef.id, assets };
  }
}
