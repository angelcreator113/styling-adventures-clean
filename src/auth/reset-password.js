// imports (replace)
import { auth } from '../utils/init-firebase.js';
import { sendPasswordResetEmail } from 'firebase/auth';


const form = document.getElementById('reset-form');
const emailInput = document.getElementById('reset-email');
const messageDisplay = document.getElementById('reset-message');
const resetBtn = document.getElementById('reset-btn');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  messageDisplay.textContent = '';

  if (!email.includes('@')) {
    messageDisplay.textContent = 'Please enter a valid email.';
    emailInput.classList.add('invalid');
    return;
  }

  emailInput.classList.remove('invalid');
  resetBtn.disabled = true;
  resetBtn.textContent = 'Sending...';

  try {
    await sendPasswordResetEmail(auth, email);
    messageDisplay.textContent = '✅ Reset link sent! Check your inbox.';
    messageDisplay.style.color = 'green';
  } catch (err) {
    console.error(err);
    messageDisplay.textContent = 'Error: ' + err.message;
    messageDisplay.style.color = 'crimson';
  } finally {
    resetBtn.disabled = false;
    resetBtn.textContent = 'Send Reset Link';
  }
});
