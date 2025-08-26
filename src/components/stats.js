// src/components/stats.js
import { authReady, db } from '@/utils/init-firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function loadStats() {
  const statsGrid = document.getElementById('closet-stats');
  if (!statsGrid) return;

  try {
    const user = await authReady();   // wait for initial auth
    if (!user) {
      statsGrid.innerHTML = '<p>Sign in to see stats.</p>';
      return;
    }

    const closetRef = collection(db, `users/${user.uid}/closet`);
    const snapshot = await getDocs(closetRef);

    const totalPieces = snapshot.size;
    const categories = new Set();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let recentUploads = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      if (data.category) categories.add(data.category);
      const ts = data.uploadedAt?.toMillis?.();
      if (typeof ts === 'number' && ts >= oneWeekAgo) recentUploads++;
    });

    statsGrid.innerHTML = `
      <div class="stat-block"><span class="stat-label">Total Pieces</span>
        <span class="stat-value" id="total-pieces">${totalPieces}</span></div>
      <div class="stat-block"><span class="stat-label">Categories</span>
        <span class="stat-value" id="category-count">${categories.size}</span></div>
      <div class="stat-block"><span class="stat-label">Recent Uploads</span>
        <span class="stat-value" id="recent-uploads">${recentUploads}</span></div>
    `;
  } catch (err) {
    console.error('🧨 Failed to load closet stats:', err);
    const friendly = /permission/i.test(err?.message || '') ?
    'Sign in to view your closet stats.' :
    'Hmm… we couldn’t load stats.';
    statsGrid.innerHTML = `<p>${friendly}</p>`;
  }
}