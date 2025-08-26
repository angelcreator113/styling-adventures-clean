// scripts/grant-admin.js
require('dotenv').config();
const admin = require('firebase-admin');

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

function parseArgs(argv) {
  const args = { adminFlag: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--on') args.adminFlag = true;
    else if (a === '--off') args.adminFlag = false;
    else if (a.startsWith('--admin=')) args.adminFlag = argv[i].split('=')[1] === 'true';
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--uid') args.uid = argv[++i];
    else if (a === '--email') args.email = argv[++i];
    else if (/^[^-].*$/.test(a) && !args.uid && !args.email) {
      // Positional fallback: node scripts/grant-admin.js <UID> [true|false]
      args.uid = a;
      const next = argv[i + 1];
      if (next === 'true' || next === 'false') {
        args.adminFlag = next === 'true';
      }
    } else {
      // ignore unknown flags to keep CLI simple
    }
  }
  return args;
}

function usage() {
  console.log(`
Usage:
  node scripts/grant-admin.js --uid <UID> [--on|--off|--admin=true|false] [--dry-run]
  node scripts/grant-admin.js --email <EMAIL> [--on|--off|--admin=true|false] [--dry-run]

Also supported (legacy positional):
  node scripts/grant-admin.js <UID> [true|false]

Notes:
- If no --on/--off/--admin= is provided, defaults to --on.
- Use --dry-run to preview without writing.
`);
}

function pretty(obj) {
  return JSON.stringify(obj || {}, null, 2);
}

async function resolveUser({ uid, email }) {
  if (!!uid === !!email) {
    throw new Error('Provide exactly one of --uid or --email.');
  }
  return email
    ? admin.auth().getUserByEmail(email)
    : admin.auth().getUser(uid);
}

async function main() {
  initAdmin();

  const args = parseArgs(process.argv);
  if (!args.uid && !args.email) {
    usage();
    process.exit(1);
  }
  // Default to "on" if unspecified (matches your previous behavior)
  if (args.adminFlag === null) args.adminFlag = true;

  const user = await resolveUser(args);
  const uid = user.uid;

  const before = user.customClaims || {};
  const after = { ...before, admin: args.adminFlag };

  console.log(`👤 Target user: ${user.email || '(no email)'}  UID: ${uid}`);
  console.log('🔎 Claims (before):', pretty(before));
  console.log('🛠️ Desired change: admin ->', args.adminFlag);

  // No-op check
  if (before.admin === args.adminFlag) {
    console.log('ℹ️ No change needed: admin already set to', args.adminFlag);
    process.exit(0);
  }

  if (args.dryRun) {
    console.log('🧪 DRY RUN: would set claims to:', pretty(after));
    process.exit(0);
  }

  await admin.auth().setCustomUserClaims(uid, after);

  // Fetch again to show final state (best-effort; may be eventually consistent)
  const userAfter = await admin.auth().getUser(uid).catch(() => null);
  const finalClaims = userAfter?.customClaims || after;

  console.log('✅ Updated claims (after):', pretty(finalClaims));
  console.log('ℹ️ User must sign out/in or call getIdToken(true) to refresh the ID token.');
}

main().catch((err) => {
  console.error('❌ Failed to set claim:', err?.message || err);
  process.exit(1);
});
