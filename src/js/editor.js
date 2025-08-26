// js/editor.js
import { setupSmartDropdown } from '../components/smart-dropdown.js';

// Tiny helper
const $ = (sel, root = document) => root.querySelector(sel);
const $select = (id, root = document) => root.querySelector(`#${id}`);

// Keep a reference to the active dropdown instance (closet only)
let activeClosetDD = null;

export function setupModalEvents() {
  const modal = document.getElementById("meta-editor-modal");
  const closeBtn = document.getElementById("close-modal");

  if (modal && closeBtn) {
    closeBtn.addEventListener("click", () => modal.classList.remove("show"));
  }

  const types = ["closet", "voice", "episode"];

  types.forEach(type => {
    const grid = document.querySelector(`#${type}-grid`);
    if (!grid) {
      console.warn(`⚠️ No grid found for type "${type}"`);
      return;
    }

    const cards = grid.querySelectorAll(".card");
    cards.forEach(card => {
      if (card.querySelector(".edit-btn")) return; // Avoid duplicates

      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️ Edit";
      editBtn.className = "edit-btn";
      editBtn.dataset.type = type;
      editBtn.dataset.id = card.dataset.id || "";

      editBtn.addEventListener("click", () => {
        openEditModal(type, card.dataset.id, card);
      });

      card.appendChild(editBtn);
    });
  });
}

/**
 * 📦 Handle edit modal logic
 * @param {string} type - closet | voice | episode
 * @param {string} id - Firestore doc ID or internal ID
 * @param {HTMLElement} cardEl - the card element (optional, for reading current values)
 */
function openEditModal(type, id, cardEl) {
  const modal = document.getElementById("meta-editor-modal");
  if (!modal) return;

  modal.classList.add("show");
  $("#modal-type", modal).textContent = type;
  $("#modal-id", modal).textContent = id || "N/A";

  // Optional: read existing metadata from card dataset if present
  const item = cardEl ? {
    category:    cardEl.dataset.category || '',
    subcategory: cardEl.dataset.subcategory || '',
    subsubcategory: cardEl.dataset.subsubcategory || '',
    title:       cardEl.dataset.title || '',
    notes:       cardEl.dataset.notes || ''
  } : {};

  // Populate basic inputs if you have them in the modal (title, notes, etc.)
  const titleEl = $("[data-field='title']", modal);
  const notesEl = $("[data-field='notes']", modal);
  if (titleEl) titleEl.value = item.title || '';
  if (notesEl) notesEl.value = item.notes || '';

  // Clean up any previous save handler to avoid duplicates
  const saveBtn = $("#save-meta", modal);
  if (!saveBtn) return;
  saveBtn.replaceWith(saveBtn.cloneNode(true));
  const freshSaveBtn = $("#save-meta", modal);

  // Initialize SmartDropdown ONLY for closet
  activeClosetDD = null;
  if (type === "closet") {
    const catEl  = $select('closet-edit-category', modal);
    const subEl  = $select('closet-edit-subcategory', modal);
    const sub2El = $select('closet-edit-subsubcategory', modal);

    if (!catEl || !subEl || !sub2El) {
      console.warn("⚠️ Closet dropdown selects not found in modal.");
    } else {
      activeClosetDD = setupSmartDropdown(catEl, subEl, sub2El, 'closet', {
        skipActiveCheck: true,
        initialValue: {
          category: item?.category || '',
          subcategory: item?.subcategory || '',
          subsubcategory: item?.subsubcategory || ''
        }
      });
    }
  }

  // Attach fresh save handler
  freshSaveBtn.addEventListener("click", async () => {
    // Collect shared fields
    const next = {
      title: titleEl ? titleEl.value.trim() : undefined,
      notes: notesEl ? notesEl.value.trim() : undefined,
    };

    // Collect closet category selections via SmartDropdown
    if (type === "closet" && activeClosetDD) {
      const { category, subcategory, subsubcategory } = activeClosetDD.getValue();
      next.category = category || '';
      next.subcategory = subcategory || '';
      next.subsubcategory = subsubcategory || '';
    }

    // TODO: add voice/episode-specific fields here if needed

    try {
      await saveMetadata(type, id, sanitize(next));
      toast("💾 Saved!");
      modal.classList.remove("show");

      // Optionally reflect updates on the card
      if (cardEl && type === "closet") {
        if (next.category != null) cardEl.dataset.category = next.category;
        if (next.subcategory != null) cardEl.dataset.subcategory = next.subcategory;
        if (next.subsubcategory != null) cardEl.dataset.subsubcategory = next.subsubcategory;
        if (next.title != null) cardEl.dataset.title = next.title;
        if (next.notes != null) cardEl.dataset.notes = next.notes;
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast("❌ Save failed. Check console.", { variant: 'error' });
    }
  });

  console.log(`🔧 Editing [${type}] item with ID: ${id}`);
}

// ------------------
// Utilities / Stubs
// ------------------

/** Strip undefined keys to keep Firestore writes tidy */
function sanitize(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** Replace with your real toast system */
function toast(msg, opts = {}) {
  // If you have a toast component on the page, call it here.
  // For now, fallback:
  console.log("TOAST:", msg, opts);
}

/**
 * Replace this with your actual Firestore save function for each panel.
 * Example:
 *  - closet: update doc in `closet` collection
 *  - voice:  update doc in `voices` collection
 *  - episode:update doc in `episodes` collection
 */
async function saveMetadata(type, id, next) {
  // Placeholder: implement your real save
  // e.g., await updateDoc(doc(db, 'closet', id), next)
  return Promise.resolve();
}
