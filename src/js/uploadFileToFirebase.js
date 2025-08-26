// src/js/uploadFileToFirebase.js
// ✅ Module SDK only (no gstatic), uses the unified storage instance
import { storage } from '../utils/firebase-client.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * 📤 Upload a file to Firebase Storage and return the download URL
 * @param {string} type - folder name like 'closet', 'voice', etc.
 * @param {File} file
 * @param {function} onProgress - (optional) NOTE: uploadBytes has no progress
 * @param {function} onComplete - callback(downloadURL, filename)
 * @param {function} onError - callback(error)
 */
export async function uploadFileToFirebase(type, file, onProgress, onComplete, onError) {
  try {
    const filePath = `${type}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);

    // For progress, switch to uploadBytesResumable and wire state_changed.
    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);
    console.log(`✅ Uploaded to Firebase: ${downloadURL}`);

    if (onComplete) onComplete(downloadURL, file.name);
  } catch (error) {
    console.error('❌ Upload error:', error);
    if (onError) onError(error);
  }
}
