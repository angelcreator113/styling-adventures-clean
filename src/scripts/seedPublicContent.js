// node src/scripts/seedPublicContent.js
const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.resolve(__dirname, "../keys/styling-admin-service-account.json"));

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

(async () => {
  const topPicks = [
    { title: "Lilac Knit Cardigan", note: "Soft & dreamy.", imageUrl: "https://...", rank: 1 },
    { title: "Pleated Midi Skirt",  note: "Swishy & comfy.", imageUrl: "https://...", rank: 2 },
  ];

  const batch = db.batch();
  topPicks.forEach((p) => batch.set(db.collection("public/top_picks/items").doc(), p));
  batch.set(db.collection("public/spotlights").doc(), {
    userName: "@evoni", quote: "Built this from my thrift finds 👀", imageUrl: "https://...", featuredAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await batch.commit();
  console.log("✅ Seeded public content");
  process.exit(0);
})();
