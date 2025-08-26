// src/scripts/seed-panels.js
const admin = require('firebase-admin');
const path  = require('path');

const serviceAccountPath = path.resolve(__dirname, '../keys/styling-admin-service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
}
const db = admin.firestore();

async function upsert(docRef, data) {
  const snap = await docRef.get();
  if (!snap.exists) await docRef.set(data);
}

async function run() {
  // panel defs (optional – use however you want in UI)
  await upsert(db.doc('panel_defs/closet'),   { slug: 'closet',   label: 'Closet' });
  await upsert(db.doc('panel_defs/voice'),    { slug: 'voice',    label: 'Voiceovers' });
  await upsert(db.doc('panel_defs/episodes'), { slug: 'episodes', label: 'Episodes' });

  // closet categories
  const closetRef = db.collection('categories').doc('closet').collection('items');

  const add = (pathArr) => closetRef.add({ path: pathArr });

  // L1
  await add(['Tops']);
  await add(['Bottoms']);
  await add(['Dresses']);
  // L2
  await add(['Tops','Shirts']);
  await add(['Tops','Sweaters']);
  await add(['Bottoms','Jeans']);
  // L3
  await add(['Tops','Shirts','Button-down']);
  await add(['Tops','Shirts','Tee']);

  console.log('✅ Seeded panels & closet categories');
}

run().catch((e) => { console.error(e); process.exit(1); });
