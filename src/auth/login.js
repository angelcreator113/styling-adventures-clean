// src/auth/login.js
import { auth } from '@/utils/init-firebase';
import { GoogleAuthProvider, signInWithPopup, getIdToken, signOut, onAuthStateChanged } from 'firebase/auth';

export function attachLoginHandlers() {
  const btn = document.getElementById('google-login');
  if (btn) {
    btn.addEventListener('click', async () => {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await getIdToken(cred.user, true);

      // send ID token to server to mint cookie
      const res = await fetch('/sessionLogin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error('sessionLogin failed');
      window.location.reload();
    });
  }

  const logout = document.getElementById('logout');
  if (logout) {
    logout.addEventListener('click', async () => {
      await fetch('/sessionLogout', { method: 'POST', credentials: 'include' });
      await signOut(auth);
      window.location.reload();
    });
  }
}

// optional: reflect auth in UI
export function onAuth(callback) {
  onAuthStateChanged(auth, (user) => callback(user));
}
