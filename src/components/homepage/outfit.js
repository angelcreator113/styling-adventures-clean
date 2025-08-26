// src/components/homepage/outfit.js
import { auth, db } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as fbLimit,
} from "firebase/firestore";

/**
 * Fetch up to `count` random items from the user's closet.
 * Returns an array of item objects (may be empty).
 */
export async function getRandomOutfit(count = 3, userId = auth.currentUser?.uid) {
  if (!userId) return [];

  // grab up to 100 most-recent items, then sample
  const snap = await getDocs(
    query(
      collection(db, `users/${userId}/closet`),
      orderBy("uploadedAt", "desc"),
      fbLimit(100)
    )
  );

  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (items.length <= count) return items;

  // Fisher–Yates shuffle then slice
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, count);
}

/**
 * DOM helper for non-React usage.
 * `target` can be a CSS selector (string) or an element.
 */
export async function generateOutfit(target = "#outfit-display", count = 3) {
  if (typeof window === "undefined") return; // SSR guard

  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) {
    console.warn("[outfit] target not found:", target);
    return;
  }
  const render = (html) => (el.innerHTML = html);

  render(`<p class="muted">Generating outfit…</p>`);

  // Ensure we have an auth user, even if sign-in just completed
  const ensureUser = () =>
    auth.currentUser
      ? Promise.resolve(auth.currentUser)
      : new Promise((resolve) => {
          const unsub = onAuthStateChanged(auth, (u) => {
            unsub();
            resolve(u || null);
          });
        });

  try {
    const user = await ensureUser();
    if (!user) {
      render(`<p class="muted">Please log in to generate outfits.</p>`);
      return;
    }

    const picks = await getRandomOutfit(count, user.uid);

    if (picks.length === 0) {
      render(
        `<p class="muted">Your closet is empty. <a href="/closet/upload">Add items</a>.</p>`
      );
      return;
    }

    render(`
      <div class="outfit-items">
        ${picks
          .map((item) => {
            const src = item.imageUrl || "/images/placeholder.png";
            const alt = item.category || "Closet item";
            return `<img src="${src}" alt="${alt}" class="outfit-img" loading="lazy">`;
          })
          .join("")}
      </div>
    `);
  } catch (err) {
    console.error("[outfit] failed:", err);
    render(`<p class="muted">Failed to generate outfit.</p>`);
  }
}