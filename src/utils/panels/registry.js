// src/utils/panels/registry.js
export const PANELS = {
  closet: {
    slug: 'closet',
    label: 'Closet',
    // user collection where uploads go
    userCollection: (uid) => `users/${uid}/closet`,
    // which categories tree to use
    categoryPanel: 'closet',
  },
  voice: {
    slug: 'voice',
    label: 'Voiceovers',
    userCollection: (uid) => `users/${uid}/voice`,
    categoryPanel: 'voice',
  },
  episodes: {
    slug: 'episodes',
    label: 'Episodes',
    // episodes are global/admin for now
    userCollection: () => `episodes`,
    categoryPanel: 'episodes',
  },
};

export const getPanel = (slug) => PANELS[slug];
export const listPanels = () => Object.values(PANELS);
