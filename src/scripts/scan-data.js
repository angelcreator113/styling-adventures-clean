// src/scripts/scan-data.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function toUid(arg) {
  if (!arg) return null;
  if (arg.includes('@')) {
    const u = await admin.auth().getUserByEmail(arg);
    return u.uid;
  }
  return arg;
}

async function countCol(path, q = null) {
  const db = admin.firestore();
  const ref = db.collection(path);
  const snap = q ? await ref.where(...q).get() : await ref.get();
  return { count: snap.size, ids: snap.docs.slice(0, 5).map(d => d.id) };
}

(async () => {
  const arg = process.argv[2] || '';
  const uid = await toUid(arg).catch(() => null);
  const db = admin.firestore();

  console.log('🔎 Scanning Firestore…');
  const topCloset = await countCol('closet');        // legacy location
  const topVoice  = await countCol('voice');
  const topEps    = await countCol('episodes');

  console.log(`  /closet         -> ${topCloset.count} docs`, topCloset.ids.length ? `sample: ${topCloset.ids.join(', ')}` : '');
  console.log(`  /voice          -> ${topVoice.count} docs`,  topVoice.ids.length  ? `sample: ${topVoice.ids.join(', ')}`  : '');
  console.log(`  /episodes       -> ${topEps.count} docs`,    topEps.ids.length    ? `sample: ${topEps.ids.join(', ')}`    : '');

  if (uid) {
    const userCloset = await countCol(`users/${uid}/closet`);
    console.log(`  users/${uid}/closet -> ${userCloset.count} docs`, userCloset.ids.length ? `sample: ${userCloset.ids.join(', ')}` : '');
  }

  console.log('✅ Done');
})();
