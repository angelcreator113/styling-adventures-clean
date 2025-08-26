import { addCategory, deleteCategory, setupCategoryDropdowns } from '../firebase/category-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const managers = document.querySelectorAll('.category-manager');

  managers.forEach(section => {
    const type = section.dataset.type;

    // Set up dropdowns for this type
    setupCategoryDropdowns(type, `${type}-`);

    const catInput = section.querySelector('.cat-input');
    const subInput = section.querySelector('.subcat-input');
    const subsubInput = section.querySelector('.subsubcat-input');
    const addBtn = section.querySelector('.add-cat-btn');
    const delBtn = section.querySelector('.delete-cat-btn');

    addBtn.addEventListener('click', async () => {
      if (!catInput.value) return alert("Enter a main category");
      await addCategory(type, catInput.value, subInput.value, subsubInput.value);
      alert("✅ Added");
      catInput.value = subInput.value = subsubInput.value = "";

      // ⏫ Refresh dropdowns
      setupCategoryDropdowns(type, `${type}-`);
    });

    delBtn.addEventListener('click', async () => {
      if (!catInput.value) return alert("Enter at least a main category");
      await deleteCategory(type, catInput.value, subInput.value, subsubInput.value);
      alert("🗑️ Deleted");
      catInput.value = subInput.value = subsubInput.value = "";

      // 🔄 Refresh dropdowns
      setupCategoryDropdowns(type, `${type}-`);
    });

    // ⚙️ Optional toggle logic (if toggle button is present)
    const toggle = section.querySelector('.toggle-cat-panel');
    if (toggle) {
      toggle.addEventListener('click', () => {
        section.classList.toggle('expanded');
      });
    }
  });
});
