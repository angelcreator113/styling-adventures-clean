export function setupThemeToggle() {
  // Remove duplicates by id (keep the first—our sidebar)
  const toggles = document.querySelectorAll('#theme-toggle');
  if (toggles.length > 1) toggles.forEach((el, i) => { if (i > 0) el.remove(); });

  let btn = document.getElementById('theme-toggle');

  // If no button exists, do nothing (sidebar owns it)
  if (!btn) return;

  if (btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  const root = document.documentElement;
  const getTheme = () => root.getAttribute('data-theme') || 'light';
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch {}
  };

  try {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
  } catch {}

  btn.addEventListener('click', () => setTheme(getTheme() === 'light' ? 'dark' : 'light'));
}
