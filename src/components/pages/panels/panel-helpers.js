// src/components/pages/panels/panel-helpers.js
// ✅ Move to modular Firestore + unified init
import { db } from '../../../utils/init-firebase.js';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Fetch a Firestore doc safely.
 * @param {string} col - collection name
 * @param {string} id  - document id
 * @returns {Promise<object|null>}
 */
export async function fetchDoc(col, id) {
  try {
    const snap = await getDoc(doc(db, col, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error(`[panel-helpers] fetchDoc(${col}/${id}) failed`, err);
    return null;
  }
}
