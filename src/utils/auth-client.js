// src/utils/auth-client.js
import { auth } from '@/utils/init-firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

async function sendSession(idToken) {
  const res = await fetch('/sessionLogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sets the __session cookie
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`sessionLogin failed (${res.status}) ${text}`);
  }
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  // Always show account picker; helpful when multiple Google accounts exist
  provider.setCustomParameters({ prompt: 'select_account' });

  const cred = await signInWithPopup(auth, provider);
  const idToken = await cred.user.getIdToken(true);
  await sendSession(idToken);
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken(true);
  await sendSession(idToken);
  return user;
}

export async function signupWithEmail(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken(true);
  await sendSession(idToken);
  return user;
}

export async function logout() {
  // Best-effort: clear server cookie, then always sign out of Firebase
  try {
    await fetch('/sessionLogout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.warn('[logout] sessionLogout failed:', e);
  } finally {
    try { await signOut(auth); } catch {}
  }
}

// Handy for debugging or guarding routes
export async function whoami() {
  try {
    const res = await fetch('/whoami', { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Optional convenience if you already have a Firebase user instance
export async function mintSessionFor(user) {
  const idToken = await user.getIdToken(true);
  await sendSession(idToken);
  return user;
}
