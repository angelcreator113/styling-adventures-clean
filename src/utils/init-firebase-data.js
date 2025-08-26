// src/utils/init-firebase-data.js
import { app } from './init-firebase';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage, list } from 'firebase/storage';

export const db = initializeFirestore(app, { useFetchStreams: true });

// Use your bucket explicitly
export const storage = getStorage(app, 'gs://styling-admin.firebasestorage.app');

/**
 * Paginate through a folder ref and call onPage(result) for each page.
 */
export async function listPages(rootRef, onPage) {
  let pageToken;
  do {
    const res = await list(rootRef, { maxResults: 1000, pageToken });
    onPage?.(res);
    pageToken = res.nextPageToken;
  } while (pageToken);
}
