// js/loadListeners.js
// imports (replace)
import { db } from '../utils/init-firebase.js';
import { getDocs, collection } from 'firebase/firestore';

export async function initUIListeners() {
  // Style Me button
  const styleMeBtn = document.querySelector('[data-action="style-me"]');
  if (styleMeBtn) {
    styleMeBtn.addEventListener("click", () => {
      alert("Coming soon! 🪄");
    });
  }

  // Future button/event hooks can go here
  fetchClosetStats();
  logCollectionNames();
}

// Example Firebase-connected function
async function fetchClosetStats() {
  // Stub for now; add Firestore queries as needed
  console.log("Fetching closet stats...");
}

// Example debug tool
async function logCollectionNames() {
  try {
    const colRef = collection(db, "closet");
    const snapshot = await getDocs(colRef);
    console.log("Closet items:", snapshot.docs.map(doc => doc.id));
  } catch (e) {
    console.error("Error fetching Firestore collections:", e);
  }
}
