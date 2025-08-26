// node src/scripts/seedPublicFromJson.js
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath = path.resolve(__dirname, "../keys/styling-admin-service-account.json");
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
}
const db = admin.firestore();

function readJson(rel) {
  const p = path.resolve(__dirname, "../../public/seed", rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

(async () => {
  try {
    const topPicks   = readJson("top_picks.json");
    const spotlights = readJson("spotlights.json");
    const threads    = readJson("threads.json");

    // public/top_picks/items/*
    const tpCol = db.collection("public").doc("top_picks").collection("items");
    for (const item of topPicks) {
      const { title, imageUrl, category, tags = [], featured = false } = item;
      await tpCol.add({
        title, imageUrl, category, tags, featured,
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log(`✓ Seeded ${topPicks.length} top picks`);

    // public/spotlights/items/*
    const spCol = db.collection("public").doc("spotlights").collection("items");
    for (const s of spotlights) {
      const featuredAt = s.featuredAtISO
        ? admin.firestore.Timestamp.fromDate(new Date(s.featuredAtISO))
        : admin.firestore.FieldValue.serverTimestamp();
      await spCol.add({
        userName: s.userName,
        quote: s.quote || "",
        imageUrl: s.imageUrl,
        featuredAt,
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log(`✓ Seeded ${spotlights.length} spotlights`);

    // forumThreads/*  (flattened top-level collection for threads)
    const thCol = db.collection("forumThreads");
    for (const t of threads) {
      const createdAt = t.createdAtISO
        ? admin.firestore.Timestamp.fromDate(new Date(t.createdAtISO))
        : admin.firestore.FieldValue.serverTimestamp();
      await thCol.add({
        title: t.title,
        excerpt: t.excerpt || "",
        displayName: t.displayName || "Bestie",
        uid: t.uid || "seed",
        createdAt,
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log(`✓ Seeded ${threads.length} threads`);
  } catch (e) {
    console.error("❌ Seed failed", e);
    process.exit(1);
  }
  process.exit(0);
})();
