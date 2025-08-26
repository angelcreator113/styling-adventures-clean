// src/scripts/gcs-set-cors.js
require('dotenv').config({ override: true });
const { Storage } = require('@google-cloud/storage');

(async () => {
  const storage = new Storage();
  const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

  const cors = [{
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    responseHeader: ['Content-Type', 'Authorization', 'x-goog-meta-*', 'x-goog-hash', 'x-goog-acl', 'Location', 'x-goog-storage-class'],
    maxAgeSeconds: 3600,
  }];

  const [before] = await bucket.getMetadata();
  console.log('[before] cors:', before.cors || []);

  await bucket.setMetadata({ cors });
  const [after] = await bucket.getMetadata();
  console.log('[after]  cors:', after.cors || []);
})();
