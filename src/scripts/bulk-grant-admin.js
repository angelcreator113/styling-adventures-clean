// scripts/bulk-grant-admin.js
require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const readline = require('readline');

function initAdmin() {
  if (admin.apps.length) return;

  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucket) throw new Error('FIREBASE_STORAGE_BUCKET missing');

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: bucket,
    });
    return;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const json = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(json),
      storageBucket: bucket,
    });
    return;
  }

  throw new Error('Missing credentials: set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_B64');
}

async function setAdminFlagForUser(user) {
  const uid = user.uid;
  const currentClaims = user.customClaims || {};
  if (currentClaims.admin === true) {
    console.log(`✔️ Already admin: ${user.email || uid}`);
    return;
  }

  const newClaims = { ...currentClaims, admin: true };
  await admin.auth().setCustomUserClaims(uid, newClaims);
  console.log(`✅ Granted admin: ${user.email || uid}`);
}

async function processLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const user = trimmed.includes('@')
      ? await admin.auth().getUserByEmail(trimmed)
      : await admin.auth().getUser(trimmed);

    await setAdminFlagForUser(user);
  } catch (err) {
    console.error(`❌ Failed to process '${trimmed}':`, err.message);
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('❌ Usage: node bulk-grant-admin.js users.csv');
    process.exit(1);
  }

  initAdmin();

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    await processLine(line);
  }

  console.log('🎉 All users processed.');
}

main().catch((err) => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
