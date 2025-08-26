import React, { useState } from "react";

export default function ConfessionsPage() {
  const [text, setText] = useState("");

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card">
        <div className="card__body">
          <h2 className="card__title">Closet Confessions</h2>
          <p className="muted">Anonymous tales of fashion oopsies and epic glow-ups.</p>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Spill the tea</label>
              <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="I wore socks with sandals and… honestly? I’d do it again." />
            </div>
            <button className="tb-btn primary">Post Anonymously</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card__body">
          <h3 className="card__title">Recent Confessions</h3>
          <div className="empty">No posts yet — be the first 🫢</div>
        </div>
      </div>
    </div>
  );
}
