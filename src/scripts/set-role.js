// src/scripts/set-role.js (CommonJS)
// Usage examples:
//   npm run set:role -- "user@example.com" admin
//   npm run set:role -- "user@example.com" creator 5
//   npm run set:role -- "user@example.com" fan
//
// If a 3rd arg is provided for "creator", it is written to Firestore at:
//   users/{uid}/settings/profile { spacesCap: <number> }

require('dotenv').config();
const admin = require('firebase-admin');

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

const db = admin.firestore();

const VALID = new Set(['fan', 'creator', 'admin']);

async function main() {
  const email = process.argv[2];
  const role  = (process.argv[3] || '').toLowerCase().trim();
  const spacesCapArg = process.argv[4]; // optional, only for creator

  if (!email || !role || !VALID.has(role)) {
    console.error(
      '❌ Usage:\n' +
      '  npm run set:role -- "user@example.com" admin\n' +
      '  npm run set:role -- "user@example.com" creator 5  # (optional spaces cap)\n' +
      '  npm run set:role -- "user@example.com" fan'
    );
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);

    // Prepare claims
    const existing = user.customClaims || {};
    const next = { ...existing, role };

    // Convenience boolean (some legacy code checks .admin === true)
    if (role === 'admin') next.admin = true;
    else if ('admin' in next) delete next.admin;

    await admin.auth().setCustomUserClaims(user.uid, next);
    console.log(`✅ Set claims for ${email}: ${JSON.stringify(next)}`);

    // Optional: if role is creator and a spaces cap is provided, write to Firestore
    if (role === 'creator' && spacesCapArg != null) {
      const spacesCap = Number(spacesCapArg);
      if (Number.isFinite(spacesCap) && spacesCap >= 0) {
        await db
          .doc(`users/${user.uid}/settings/profile`)
          .set({ spacesCap }, { merge: true });
        console.log(`✅ Wrote spacesCap=${spacesCap} to users/${user.uid}/settings/profile`);
      } else {
        console.warn('⚠️  Ignored invalid spaces cap (must be a non-negative number).');
      }
    }

    console.log('ℹ️  User may need to refresh their session to pick up new claims.');
  } catch (err) {
    console.error('❌ Failed to set role:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
