// src/scripts/gcs-upload-canary.js
require('dotenv').config({ override: true });
const { Storage } = require('@google-cloud/storage');

(async () => {
  console.log('[canary] starting');
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) throw new Error('FIREBASE_STORAGE_BUCKET missing');

  const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });

  const bucket = storage.bucket(bucketName);
  const objectName = `smoke/hello-${Date.now()}.txt`;
  const file = bucket.file(objectName);

  await file.save('hello from canary', {
    resumable: false,
    contentType: 'text/plain',
  });
  console.log('[canary] uploaded ->', objectName);

  const [exists] = await file.exists();
  console.log('[canary] exists?', exists);

  const [metadata] = await file.getMetadata();
  console.log('[canary] size:', metadata.size, 'contentType:', metadata.contentType);
})();
