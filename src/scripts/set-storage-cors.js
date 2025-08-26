// src/scripts/set-storage-cors.js
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
    console.log('🔧 set-storage-cors starting…');

    const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || '';
    if (!BUCKET) throw new Error('FIREBASE_STORAGE_BUCKET is not set');
    console.log('📦 Using bucket from .env =>', BUCKET);

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
    console.log('🪣 Target bucket:', bucket.name);

    const [exists] = await bucket.exists();
    if (!exists) throw new Error(`Bucket "${BUCKET}" does not exist in this project.`);

    const [beforeMeta] = await bucket.getMetadata();
    console.log('🔎 Current CORS:', JSON.stringify(beforeMeta.cors || [], null, 2));

    const cors = [
      {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        responseHeader: [
          'Content-Type',
          'Authorization',
          'x-goog-meta-*',
          'x-goog-hash',
          'x-goog-acl',
          'Location',
          'x-goog-storage-class',
        ],
        maxAgeSeconds: 3600,
      },
    ];

    console.log('📝 Setting CORS…');
    await bucket.setMetadata({ cors });

    const [afterMeta] = await bucket.getMetadata();
    console.log('✅ CORS updated for bucket:', bucket.name);
    console.log('🆕 New CORS:', JSON.stringify(afterMeta.cors || [], null, 2));
  } catch (e) {
    console.error('❌ set-storage-cors failed:', e);
    process.exitCode = 1;
  }
})();