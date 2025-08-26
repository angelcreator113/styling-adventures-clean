// src/pages/BoardsPage.jsx
import React, { useState } from "react";
import BoardsGallery from "@/components/BoardsGallery.jsx";
import BoardView from "@/components/BoardView.jsx";

export default function BoardsPage() {
  const [openBoard, setOpenBoard] = useState(null);
  return (
    <div className="boards-page grid-2">
      <div className="left">
        <BoardsGallery onOpen={setOpenBoard} />
      </div>
      <div className="right">
        {openBoard ? <BoardView board={openBoard} /> : <div className="muted" style={{padding:16}}>Select a board…</div>}
      </div>

      <style>{`
        .boards-page.grid-2 { display:grid; grid-template-columns: 380px 1fr; gap:16px; }
        @media (max-width: 1000px) { .boards-page.grid-2 { grid-template-columns: 1fr; } .right { order:-1; } }
      `}</style>
    </div>
  );
}
