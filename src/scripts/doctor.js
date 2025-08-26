// src/scripts/doctor.js
require('dotenv').config({ override: true });
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

(async () => {
  console.log('[doctor] Node:', process.version);
  console.log('[doctor] BUCKET:', process.env.FIREBASE_STORAGE_BUCKET);
  console.log('[doctor] CREDS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }

  // Auth ping
  try {
    const list = await admin.auth().listUsers(1);
    console.log('[doctor] admin.auth OK, sample uid:', list.users[0]?.uid || '(none)');
  } catch (e) {
    console.error('[doctor] admin.auth FAIL', e.message);
  }

  // Storage ping
  try {
    const storage = new Storage();
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const [exists] = await bucket.exists();
    console.log('[doctor] bucket.exists:', exists);
    const [files] = await bucket.getFiles({ prefix: 'smoke/', maxResults: 3 });
    console.log('[doctor] smoke files:', files.map(f => f.name));
  } catch (e) {
    console.error('[doctor] storage FAIL', e.message);
  }
})();
