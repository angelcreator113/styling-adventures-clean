const admin = require('firebase-admin');
const path = require('path');
const serviceAccountPath = path.resolve(__dirname, '../keys/styling-admin-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
}

(async () => {
  const arg = process.argv[2];
  if (!arg) { console.error('usage: node src/scripts/setAdminClaim.js <email|uid>'); process.exit(1); }

  const user = arg.includes('@')
    ? await admin.auth().getUserByEmail(arg)
    : await admin.auth().getUser(arg);

  const current = user.customClaims || {};
  await admin.auth().setCustomUserClaims(user.uid, { ...current, role: 'admin', admin: true });

  console.log(`✓ role=admin set for ${user.email || user.uid}`);
  process.exit(0);
})();

