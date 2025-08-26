// Migrate legacy top-level /closet docs → /users/{uid}/closet
// Usage:
//   node -r dotenv/config ./src/scripts/migrate-closet.js <UID> [--dry] [--keep]
// Examples:
//   node -r dotenv/config ./src/scripts/migrate-closet.js l3yEYFekNPbIyNHNLR3TLO6Nkfx2 --dry
//   node -r dotenv/config ./src/scripts/migrate-closet.js l3yEYFekNPbIyNHNLR3TLO6Nkfx2

const admin = require('firebase-admin');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

// Init Admin SDK (uses GOOGLE_APPLICATION_CREDENTIALS from .env)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

(async () => {
  const uid = process.argv[2];
  if (!uid) fail('Missing UID. Example: migrate-closet.js <UID> [--dry] [--keep]');

  const args = process.argv.slice(3);
  const DRY  = args.includes('--dry');
  const KEEP = args.includes('--keep');

  console.log(`\n🚚 Migrating legacy /closet → /users/${uid}/closet`);
  console.log(`   Options: dry=${DRY} keepSource=${KEEP}\n`);

  const srcCol = db.collection('closet');               // legacy collection
  const dstCol = db.collection(`users/${uid}/closet`);  // new location

  const snap = await srcCol.get();
  if (snap.empty) {
    console.log('ℹ️  No legacy /closet docs found.');
    process.exit(0);
  }

  let total = 0, copied = 0, skippedOwner = 0, exists = 0, deleted = 0;
  const writer = db.bulkWriter();

  for (const doc of snap.docs) {
    total++;
    const data = doc.data() || {};

    // If the legacy doc has a uid and it's not this user, skip it.
    if (data.uid && data.uid !== uid) {
      skippedOwner++;
      console.log(`↷ skip (owner ${data.uid}): closet/${doc.id}`);
      continue;
    }

    const dstRef = dstCol.doc(doc.id);

    // Check destination conflicts
    const dstExists = (await dstRef.get()).exists;
    if (dstExists) {
      exists++;
      console.log(`↷ skip (already exists): users/${uid}/closet/${doc.id}`);
      continue;
    }

    // Prepare migrated document
    const migrated = {
      ...data,
      uid, // ensure correct owner
      visibility: (data.visibility === 'public' || data.visibility === 'private') ? data.visibility : 'private',
      migratedFrom: 'closet',
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`→ copy: closet/${doc.id}  ->  users/${uid}/closet/${doc.id}`);

    if (!DRY) {
      // write new doc
      writer.set(dstRef, migrated, { merge: true });

      // optionally delete source
      if (!KEEP) {
        const srcRef = srcCol.doc(doc.id);
        writer.delete(srcRef);
        deleted++;
      }

      copied++;
    }
  }

  if (!DRY) await writer.close();

  console.log('\n✅ Migration summary');
  console.log(`   scanned:  ${total}`);
  console.log(`   copied:   ${copied}`);
  console.log(`   skipped (owner mismatch): ${skippedOwner}`);
  console.log(`   skipped (already exists at dest): ${exists}`);
  console.log(`   deleted source: ${DRY ? 0 : deleted}`);
  console.log('');
  process.exit(0);
})();
