import { onCategories, getCategories } from '../categoryStore.js';
export function bindData(panel, onData) {
  const unsub = onCategories(panel, () => onData(getCategories(panel)));
  onData(getCategories(panel)); // initial
  return unsub;
}
