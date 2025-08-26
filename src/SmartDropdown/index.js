import { createState } from './state.js';
import { bindData } from './adapter.js';
import { mount } from './view.js';

export function initSmartDropdown(rootEl, { panel, ids }) {
  const state = createState();
  const unbind = bindData(panel, (data) => mount(rootEl, data, state, ids));
  return {
    getValue: () => state.get(),
    setValue: (v) => state.set(v),
    destroy: () => unbind(),
  };
}
