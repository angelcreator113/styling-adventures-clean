// src/pages/Sidebar/ForumPage.jsx
import React from "react";
import ChatLobby from "@/components/ChatLobby.jsx";

export default function ForumPage() {
  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card">
        <div className="page-header">
          <h2 className="page-title">Style Forum</h2>
          <div className="crumbs">
            <span>Community</span><span className="crumb-sep">/</span><span>Forum</span>
          </div>
        </div>
        <ChatLobby />
      </div>
    </section>
  );
}
