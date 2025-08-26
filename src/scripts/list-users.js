// src/scripts/list-users.js
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../keys/styling-admin-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
}

(async () => {
  let nextPageToken;
  let i = 0;
  do {
    const res = await admin.auth().listUsers(1000, nextPageToken);
    res.users.forEach(u => {
      console.log(
        `${String(++i).padStart(3)}  ${u.email || '(no email)'}  uid=${u.uid}  admin=${u.customClaims?.admin ? 'yes' : 'no'}`
      );
    });
    nextPageToken = res.pageToken;
  } while (nextPageToken);
})();
