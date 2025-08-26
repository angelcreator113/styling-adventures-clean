// src/utils/storage-helpers.js
import { ref } from 'firebase/storage';
import { storage, listPages, listAllSafe } from './init-firebase';

// Page through a folder (call onPage for each page)
export async function listFolderPaged(folderPath, onPage) {
  const r = ref(storage, folderPath);
  await listPages(r, onPage);
}

// Get everything under a folder (ok for smaller folders)
export async function listFolderAll(folderPath) {
  const r = ref(storage, folderPath);
  return listAllSafe(r);
}
