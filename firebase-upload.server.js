const { storage, db } = require('./firebase-config.js'); // ✅ Already initialized
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// 🧼 Remove this to avoid "Identifier 'storage' has already been declared"
// ❌ const storage = getStorage(); ❌
// ❌ const db = getFirestore(); ❌

/**
 * 📤 Uploads a file to Firebase Storage
 * @param {string} localFilePath - Path to the local file
 * @param {string} destination - Destination path in Firebase Storage
 * @returns {Promise<string>} - Public download URL
 */
async function uploadToFirebaseStorage(localFilePath, destination) {
  const bucket = storage.bucket();
  const token = uuidv4();

  const options = {
    destination,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  };

  await bucket.upload(localFilePath, options);

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${token}`;
  return url;
}

module.exports = {
  uploadToFirebaseStorage
};