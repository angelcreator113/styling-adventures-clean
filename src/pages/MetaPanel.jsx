// --- MetaPanel.jsx ---
import React from 'react';
import Layout from './Layout';

export default function MetaPanel() {
  return (
    <Layout>
      <section id="meta-panel" className="panel panel-card flex-1 minw-300 bg-white rounded-lg p-2rem shadow-sm">
        <h2 className="text-purple-dark mb-2rem">Meta Information</h2>
        <p className="text-sm text-gray-600 mb-4">
          You can add metadata here for tracking, search, or localization purposes.
        </p>
        <form className="flex-col gap-1rem">
          {/* 🌱 Meta fields coming soon */}
        </form>
      </section>
    </Layout>
  );
}