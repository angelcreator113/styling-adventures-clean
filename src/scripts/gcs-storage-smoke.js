// scripts/gcs-storage-smoke.js
require('dotenv').config({ override: true });

process.on('unhandledRejection', err => { console.error('[unhandledRejection]', err); process.exit(1); });
process.on('uncaughtException', err => { console.error('[uncaughtException]', err); process.exit(1); });

(async () => {
  const fs = require('fs');
  const path = require('path');

  console.log('[smoke] boot');
  console.log('[smoke] CWD:', process.cwd());
  console.log('[smoke] Node:', process.version);

  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || '';

  console.log('[smoke] GOOGLE_APPLICATION_CREDENTIALS:', creds || '(missing)');
  console.log('[smoke] FIREBASE_STORAGE_BUCKET:', bucketName || '(missing)');

  if (!bucketName) throw new Error('FIREBASE_STORAGE_BUCKET missing');
  if (creds) {
    const abs = path.resolve(creds);
    if (!fs.existsSync(abs)) console.warn('[smoke] WARNING: credentials file not found at', abs);
  }

  let Storage;
  try {
    ({ Storage } = require('@google-cloud/storage'));
  } catch (e) {
    console.error('[smoke] Could not require @google-cloud/storage. Did you run "npm i"?');
    throw e;
  }

  const storage = new Storage({ keyFilename: creds || undefined });
  const bucket = storage.bucket(bucketName);
  console.log('[smoke] Bucket name:', bucket.name);

  const [exists] = await bucket.exists();
  console.log('[smoke] bucket.exists ->', exists);
  if (!exists) throw new Error(`Bucket "${bucketName}" not found`);

  const [files] = await bucket.getFiles({ maxResults: 10 });
  console.log('[smoke] sample objects:', files.map(f => f.name));

  const [meta] = await bucket.getMetadata();
  console.log('[smoke] CORS:', JSON.stringify(meta.cors || [], null, 2));
})();
