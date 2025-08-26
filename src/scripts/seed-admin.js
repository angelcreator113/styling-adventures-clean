// src/scripts/seed-admin.js (CommonJS)
// Usage: npm run seed:admin -- "admin@example.com"

require('dotenv').config();               // loads .env for ADC or B64 creds
const admin = require('firebase-admin');

// --- Initialize Firebase Admin ---
// Prefer a base64-encoded service account if provided (.env:FIREBASE_SERVICE_ACCOUNT_B64)
// Else fall back to Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
(function initAdmin() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!admin.apps.length) {
    if (b64) {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      admin.initializeApp({ credential: admin.credential.cert(json) });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  }
})();

async function main() {
  const email = process.argv[2]; // from CLI: npm run seed:admin -- "email"
  if (!email) {
    console.error('❌ Please provide an email: npm run seed:admin -- "admin@example.com"');
    process.exit(1);
  }

  try {
    // Look up or create the user by email (in case account exists without password)
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (e) {
      console.error(`❌ User ${email} not found in Firebase Auth.\nCreate the user in Firebase Console (Email/Password) then re-run this command.`);
      process.exit(1);
    }

    // Merge role with any existing claims
    const existing = userRecord.customClaims || {};
    const nextClaims = { ...existing, role: 'admin', admin: true };

    await admin.auth().setCustomUserClaims(userRecord.uid, nextClaims);

    console.log(`✅ ${email} is now an admin (claims set: ${JSON.stringify(nextClaims)})`);
    console.log('ℹ️  If the user was signed in, they may need to reload / sign out/in to refresh claims.');
  } catch (err) {
    console.error('❌ Failed to seed admin:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();

