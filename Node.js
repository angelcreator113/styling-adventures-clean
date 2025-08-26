// Node.js admin script
const admin = require('firebase-admin');
admin.initializeApp();
async function grantAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log('Admin claim set for', uid);
}
grantAdmin('THE_USER_UID');
