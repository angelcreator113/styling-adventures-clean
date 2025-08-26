export function createState() {
  let value = { category: '', subcategory: '', subsubcategory: '' };
  const listeners = new Set();
  return {
    get: () => value,
    set: (next) => { value = { ...value, ...next }; listeners.forEach(l=>l(value)); },
    on: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
  };
}
