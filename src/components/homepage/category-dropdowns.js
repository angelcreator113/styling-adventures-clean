// 🔁 Unified category structure
const categoryMap = {
  closet: {
    Tops: {
      TShirts: ["Sleeveless", "Short Sleeve", "Long Sleeve"],
      Sweaters: ["Cardigans", "Pullovers"]
    },
    Bottoms: {
      Pants: ["Jeans", "Slacks"],
      Shorts: ["Denim", "Athletic"]
    }
  },
  voice: {
    Narration: {
      English: ["Male", "Female"],
      Spanish: ["Male", "Female"]
    },
    Effects: {
      Ambience: ["Rain", "Wind"],
      Sounds: ["Clicks", "Pops"]
    }
  },
  episode: {
    Tutorials: {
      Beginner: ["Intro", "Setup"],
      Advanced: ["Debugging", "Deployment"]
    },
    Interviews: {
      Guests: ["Artists", "Writers"]
    }
  }
};

/**
 * 📂 Cascade category selector for a given panel type
 */
export function setupCategoryDropdowns(type) {
  const map = categoryMap[type];
  if (!map) return;

  const cat = document.getElementById(`${type}-category`);
  const sub = document.getElementById(`${type}-subcategory`);
  const subsub = document.getElementById(`${type}-subsubcategory`);

  if (!cat) {
    console.warn(`[dropdowns] Missing primary category element: #${type}-category`);
    return;
  }

  function populateSelect(select, options) {
    if (!select) return;
    select.innerHTML = `<option value="">Select</option>`;
    Object.keys(options).forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = key;
      select.appendChild(opt);
    });
  }

  populateSelect(cat, map);

  cat.onchange = () => {
    if (sub) {
      sub.innerHTML = `<option value="">Select</option>`;
      populateSelect(sub, map[cat.value] || {});
    }
    if (subsub) subsub.innerHTML = `<option value="">Select</option>`;
  };

  sub?.addEventListener("change", () => {
    if (!subsub) return;
    subsub.innerHTML = `<option value="">Select</option>`;
    const selected = map[cat.value]?.[sub.value];
    if (Array.isArray(selected)) {
      selected.forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        subsub.appendChild(opt);
      });
    }
  });
}
