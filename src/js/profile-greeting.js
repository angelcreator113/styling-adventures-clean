// src/js/profile-greeting.js
import { readGreetingName, saveGreetingName } from '../js/greeting-store.js';

export function initProfileGreeting() {
  const input = document.getElementById('greetName');
  const save = document.getElementById('greetSave');
  const status = document.getElementById('greetStatus');
  if (!input || !save) return;

  // load current
  input.value = readGreetingName();

  save.addEventListener('click', () => {
    const next = (input.value || '').trim() || 'Bestie';
    saveGreetingName(next);

    // live-update sidebar if present
    const slot = document.getElementById('sidebar-greeting');
    if (slot) slot.textContent = `Bestie, ${next}, Welcome Back!`;

    if (status) status.textContent = 'Saved ✔';
    setTimeout(() => status && (status.textContent = ''), 1500);
  });
}
