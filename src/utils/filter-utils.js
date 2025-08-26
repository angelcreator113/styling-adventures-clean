// filter-utils.js
export function hookFilters(section, rawData, renderFn) {
  const searchInput = document.getElementById(`${section}-search`);
  const filterSelect = document.getElementById(`${section}-filter-subcategory`);
  const clearBtn = document.getElementById(`${section}-clear-filters`);

  // Populate filter dropdown with unique subcategories
  const subs = new Set();
  Object.values(rawData).forEach(submap => {
    Object.keys(submap).forEach(s => subs.add(s));
  });
  filterSelect.innerHTML = '<option value="">All</option>';
  subs.forEach(s => filterSelect.add(new Option(s, s)));

  const applyFilters = () => {
    const query = searchInput.value.toLowerCase();
    const selectedSub = filterSelect.value;

    const filtered = {};
    for (const [cat, submap] of Object.entries(rawData)) {
      filtered[cat] = {};
      for (const [sub, items] of Object.entries(submap)) {
        if (selectedSub && sub !== selectedSub) continue;
        const matched = items.filter(i =>
          i.filename.toLowerCase().includes(query) ||
          (i.tags || []).some(t => t.toLowerCase().includes(query))
        );
        if (matched.length) filtered[cat][sub] = matched;
      }
      if (Object.keys(filtered[cat]).length === 0) delete filtered[cat];
    }

    renderFn(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  filterSelect.addEventListener('change', applyFilters);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterSelect.value = '';
    applyFilters();
  });
}
/**
 * 🎧 For flat arrays like voice or episode dashboard filtering
 * @param {string} section - "voice" or "episode"
 * @param {Array} data - Flat array of file metadata
 * @param {Function} renderFn - Function to re-render UI with filtered results
 */
export function hookFlatFilters(section, data, renderFn) {
  const searchInput = document.getElementById(`${section}-search-input`);
  const catSelect = document.getElementById(`${section}-filter-category`);
  const subcatSelect = document.getElementById(`${section}-filter-subcategory`);
  const subsubSelect = document.getElementById(`${section}-filter-subsubcategory`);
  const clearBtn = document.getElementById(`${section}-clear-filters`);

  const applyFilters = () => {
    const searchQuery = searchInput?.value?.toLowerCase() || '';
    const cat = catSelect?.value || '';
    const subcat = subcatSelect?.value || '';
    const subsub = subsubSelect?.value || '';

    const filtered = data.filter(item => {
      const matchesSearch =
        !searchQuery ||
        item.filename?.toLowerCase().includes(searchQuery) ||
        (item.tags || []).some(tag => tag.toLowerCase().includes(searchQuery));

      const matchesCategory = !cat || item.category === cat;
      const matchesSubcategory = !subcat || item.subcategory === subcat;
      const matchesSubsubcategory = !subsub || item.subsubcategory === subsub;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesSubsubcategory
      );
    });

    renderFn(filtered);
  };

  searchInput?.addEventListener('input', applyFilters);
  catSelect?.addEventListener('change', applyFilters);
  subcatSelect?.addEventListener('change', applyFilters);
  subsubSelect?.addEventListener('change', applyFilters);
  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (catSelect) catSelect.value = '';
    if (subcatSelect) subcatSelect.value = '';
    if (subsubSelect) subsubSelect.value = '';
    applyFilters();
  });
}
/**
 * 🔍 Get filtered dataset based on current search and dropdowns
 */
export function getFilteredData(data, panelType) {
  const searchValue = document.getElementById(`${panelType}-search`)?.value?.toLowerCase() || '';
  const catValue = document.getElementById(`${panelType}-filter-category`)?.value || '';
  const subValue = document.getElementById(`${panelType}-filter-subcategory`)?.value || '';
  const subSubValue = document.getElementById(`${panelType}-filter-subsubcategory`)?.value || '';

  return data.filter(item => {
    const filenameMatch = (item.filename || '').toLowerCase().includes(searchValue);
    const categoryMatch = !catValue || item.category === catValue;
    const subcategoryMatch = !subValue || item.subcategory === subValue;
    const subsubcategoryMatch = !subSubValue || item.subsubcategory === subSubValue;
    return filenameMatch && categoryMatch && subcategoryMatch && subsubcategoryMatch;
  });
}
