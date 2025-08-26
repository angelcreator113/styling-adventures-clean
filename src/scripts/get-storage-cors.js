// src/scripts/get-storage-cors.js
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// Load the root .env explicitly and override any stale env
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  override: true,
});

(async () => {
  try {
    console.log('🔎 get-storage-cors starting…');

    const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || '';
    if (!BUCKET) throw new Error('FIREBASE_STORAGE_BUCKET is not set');
    console.log('📦 Bucket from .env =>', BUCKET);

    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    if (!keyPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set');

    const abs = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    if (!fs.existsSync(abs)) throw new Error(`Creds file not found: ${abs}`);

    const json = require(abs);
    admin.initializeApp({
      credential: admin.credential.cert(json),
      storageBucket: BUCKET,
    });
    console.log('✅ Admin initialized with key ->', abs);

    const bucket = admin.storage().bucket(BUCKET);
    console.log('🪣 Using bucket:', bucket.name);

    const [exists] = await bucket.exists();
    if (!exists) throw new Error(`Bucket "${BUCKET}" does not exist in this project.`);

    const [meta] = await bucket.getMetadata();
    console.log('📄 CORS:', JSON.stringify(meta.cors || [], null, 2));
  } catch (e) {
    console.error('❌ get-storage-cors failed:', e);
    process.exitCode = 1;
  }
})();
