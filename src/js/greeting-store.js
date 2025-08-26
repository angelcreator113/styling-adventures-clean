// src/js/greeting-store.js
const K = {
  name: 'greetingName',
  last: 'lastLoginAt',
  email: 'authEmail',        // optional if you stash auth basics
  display: 'authDisplayName' // optional
};

export function readGreetingName() {
  const ls = localStorage;
  const name =
    (ls.getItem(K.name) || '').trim() ||
    (ls.getItem(K.display) || '').trim() ||
    (ls.getItem(K.email) || '').split('@')[0] ||
    'Bestie';
  return name;
}

export function saveGreetingName(name) {
  try { localStorage.setItem(K.name, name.trim()); } catch {}
}

export function readReturningFlag() {
  const last = localStorage.getItem(K.last);
  return !!last; // if any last login exists → returning
}

export function markLogin() {
  try { localStorage.setItem(K.last, new Date().toISOString()); } catch {}
}

/** Full greeting line based on flags */
export function makeGreeting() {
  const name = readGreetingName();
  const returning = readReturningFlag();
  return returning
    ? `Bestie, ${name}, Welcome Back!`
    : `Bestie, ${name}, Welcome!`;
}
