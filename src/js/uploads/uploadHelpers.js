// src/js/uploads/uploadHelpers.js
// Unified init + modular SDK
import { db, storage } from '../../utils/init-firebase.js';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';

/**
 * Upload a single blob/file to Cloud Storage with metadata.
 * Returns { path, url }.
 */
export async function uploadFile(
  fileOrBlob,
  path,
  {
    filename,
    contentType,
    cacheControl = 'public,max-age=31536000',
    customMetadata = {},
    onProgress,
  } = {}
) {
  const safeName =
    filename ||
    fileOrBlob?.name ||
    `file-${Date.now()}.${(fileOrBlob?.type || 'image/png').split('/')[1] || 'bin'}`;

  const storageRef = ref(storage, `${path}/${encodeURIComponent(safeName)}`);
  const meta = {
    contentType: contentType || fileOrBlob?.type || undefined,
    cacheControl,
    customMetadata,
  };

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, fileOrBlob, meta);
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress(pct);
        }
      },
      reject,
      resolve
    );
  });

  const url = await getDownloadURL(storageRef);
  return { path: storageRef.fullPath, url };
}

/**
 * Save metadata to Firestore with optional dedupe.
 * collPath can be a nested path, e.g. `users/${uid}/closet`.
 * Returns { id, ref, existed }.
 */
export async function saveFileMetadata(collPath, metadata, { dedupeBy } = {}) {
  const collRef = collection(db, collPath);

  if (dedupeBy && metadata[dedupeBy]) {
    const qy = query(collRef, where(dedupeBy, '==', metadata[dedupeBy]), limit(1));
    const snap = await getDocs(qy);
    if (!snap.empty) {
      await setDoc(
        snap.docs[0].ref,
        { ...metadata, updatedAt: serverTimestamp() },
        { merge: true }
      );
      return { id: snap.docs[0].id, ref: snap.docs[0].ref, existed: true };
    }
  }

  const docRef = await addDoc(collRef, {
    ...metadata,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ref: docRef, existed: false };
}

/**
 * Convenience for closet items:
 * - uploads the PRIMARY file (variant "primary"),
 * - uploads extra assets (preview/icon/hover) WITHOUT creating extra docs,
 * - saves ONE Firestore doc under users/{uid}/closet with assets nested.
 *
 * @returns { docId, url, assets }
 */
export async function uploadPrimaryAndExtras(fileOrBlob, {
  uid,
  basePath,                 // e.g. `users/${uid}/closet`
  fields = {},              // { title, category, subcategory, subsubcategory, public, ... }
  clientUploadId,           // dedupe key (same as you compute in UI)
  intentToken,              // optional tracing
  extraUploads = [],        // [{ key:'preview'|'icon'|'iconHover', blob, contentType, filename }]
  onProgress,
} = {}) {
  if (!uid) throw new Error('uid required');
  if (!basePath) throw new Error('basePath required');

  // 1) Upload primary
  const primary = await uploadFile(fileOrBlob, basePath, {
    filename: fields?.title ? `${fields.title}.png` : undefined,
    contentType: fileOrBlob?.type || 'image/png',
    customMetadata: {
      variant: 'primary',
      clientUploadId: clientUploadId || '',
      intentToken: intentToken || '',
      uid,
      category: fields.category || '',
      subcategory: fields.subcategory || '',
      subsubcategory: fields.subsubcategory || '',
    },
    onProgress,
  });

  // 2) Upload extras (no separate documents)
  const assets = {};
  for (const a of extraUploads) {
    if (!a?.blob) continue;
    const key = a.key || 'asset';
    const up = await uploadFile(a.blob, `${basePath}/${key}`, {
      filename: a.filename || `${(fields.title || 'asset')}-${key}.png`,
      contentType: a.contentType || a.blob.type || 'image/png',
      customMetadata: {
        variant: key, // 'preview' | 'icon' | 'iconHover'
        clientUploadId: clientUploadId || '',
        intentToken: intentToken || '',
        uid,
        category: fields.category || '',
        subcategory: fields.subcategory || '',
        subsubcategory: fields.subsubcategory || '',
      },
    });
    assets[key] = up; // { path, url }
  }

  // 3) Save ONE closet doc (variant: 'primary'); extras nested under assets
  const visibility = fields.public ? 'public' : 'private';
  const { id: docId } = await saveFileMetadata(`users/${uid}/closet`, {
    uid,
    title: fields.title || null,
    category: fields.category || '',
    subcategory: fields.subcategory || '',
    subsubcategory: fields.subsubcategory || '',
    visibility,
    public: !!fields.public,                 // legacy compatibility
    variant: 'primary',                      // <-- important
    clientUploadId: clientUploadId || null,  // for dedupe
    intentToken: intentToken || null,
    storagePath: primary.path,
    url: primary.url,
    assets,                                  // { preview, icon, iconHover }
  }, { dedupeBy: 'clientUploadId' });

  return { docId, url: primary.url, assets };
}

/* ------------------------------------------------------------------ */
/* Back-compat exports (kept so older callers don’t break)             */
/* ------------------------------------------------------------------ */

// Legacy simple upload: keep signature but encourage the new one above.
export async function uploadFileSimple(file, path) {
  const { url } = await uploadFile(file, path, {});
  return url;
}

// Legacy alias (your old name)
export { saveFileMetadata as saveFileMetadataLegacy };

