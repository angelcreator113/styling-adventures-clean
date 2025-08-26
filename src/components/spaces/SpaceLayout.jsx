// SpaceLayout.jsx
import React from "react";
import "@/css/layout/space-layout.css";

export default function SpaceLayout({ aside, children }) {
  return (
    <div className="space-layout">
      <aside className="space-left">
        {aside}
      </aside>
      <main className="space-right">
        {children}
      </main>
    </div>
  );
}
