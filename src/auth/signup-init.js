// imports (replace)
import { auth } from '../utils/init-firebase.js';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', async () => {
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  const signupBtn = document.getElementById('signup-btn');
  const toggleIcon = document.getElementById('toggle-password');

  toggleIcon?.addEventListener('click', () => {
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    toggleIcon.textContent = isVisible ? '👁️' : '🙈';
  });

  try {
    const { app } = await ready(); // ✅ Wait for Firebase to be initialized
    const auth = getAuth(app);

    signupBtn?.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email.includes('@')) {
        alert('❌ Please enter a valid email.');
        return;
      }

      if (password.length < 6) {
        alert('❌ Password must be at least 6 characters.');
        return;
      }

      signupBtn.disabled = true;
      signupBtn.textContent = 'Creating...';

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('✅ Account created! Redirecting...');
        window.location.href = '/index.html';
      } catch (err) {
        alert(`❌ Sign up failed: ${err.message}`);
        console.error('Signup error:', err);
      } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
      }
    });
  } catch (err) {
    console.error('[signup-init] Firebase did not initialize in time:', err);
    alert('⚠️ Unable to connect to Firebase. Please try again shortly.');
  }
});
