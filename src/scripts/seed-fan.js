// src/scripts/seed-fan.js
const admin = require('firebase-admin');
const path = require('path');

// Service account for Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../keys/styling-admin-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
}

const db = admin.firestore();

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node seed-fan.js <email|uid>');
  process.exit(1);
}

(async () => {
  try {
    // Look up user by email or UID
    let user;
    if (arg.includes('@')) {
      user = await admin.auth().getUserByEmail(arg);
    } else {
      user = await admin.auth().getUser(arg);
    }
    const uid = user.uid;

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Minimal closet items under users/{uid}/closet
    const closetCol = db.collection('users').doc(uid).collection('closet');
    const items = [
      {
        id: 'seed-dress',
        name: 'Rose Midi Dress',
        category: 'Dresses',
        color: 'blush',
        visibility: 'public',
        uid, createdAt: now, updatedAt: now,
      },
      {
        id: 'seed-blazer',
        name: 'Cream Blazer',
        category: 'Outerwear',
        color: 'cream',
        visibility: 'private',
        uid, createdAt: now, updatedAt: now,
      },
    ];

    for (const doc of items) {
      await closetCol.doc(doc.id).set(doc, { merge: true });
      console.log('✔ closet:', doc.id);
    }

    // Optional: a couple categories under /categories/default/items
    const catCol = db.collection('categories').doc('default').collection('items');
    await catCol.doc('dresses').set({ title: 'Dresses', order: 10 }, { merge: true });
    await catCol.doc('outerwear').set({ title: 'Outerwear', order: 20 }, { merge: true });
    console.log('✔ categories: default');

    console.log('\n✅ Fan seed complete for', user.email || uid);
    process.exit(0);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      console.error('❌ Seed failed: Could not find user:', arg);
      console.error('   • Sign in once with that account at /login (so the user exists), then run this again with its uid from /whoami.');
      console.error('   • Or create a user in Firebase Console → Authentication, then run again with their email.');
    } else {
      console.error('❌ Seed failed:', e.message);
    }
    process.exit(1);
  }
})();

