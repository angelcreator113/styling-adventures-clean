export function mount(rootEl, data, state, ids) {
  const cat = rootEl.querySelector(`#${ids.categoryId}`);
  const sub = rootEl.querySelector(`#${ids.subcategoryId}`);
  const sub2= rootEl.querySelector(`#${ids.subsubcategoryId}`);

  // populate options based on `data`
  // wire change handlers: when category changes → rebuild sub/sub2
  // call state.set({category, subcategory, subsubcategory})
  // keep this file DOM-focused; no data fetching here
}
