export function renderClosetGrid(container, items, { onEdit, onVisibilityToggle }) {
  container.innerHTML = items.map(renderCardHTML).join('');
  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => onEdit(btn.dataset.id));
  });
  container.querySelectorAll('[data-vis]').forEach(btn => {
    btn.addEventListener('click', () => onVisibilityToggle(btn.dataset.id, btn.dataset.next));
  });
}
