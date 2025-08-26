// src/pages/creator/spaces/MoveModal.jsx
import React from "react";

export default function MoveModal({ open, onClose, spaces, currentSpaceId, moveToSpace, setMoveToSpace, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal__hd"><h3 className="modal__title">Move selected items</h3></div>
        <div className="modal__bd">
          <label className="input">
            <div className="input__label">Move to Space</div>
            <select className="select" value={moveToSpace} onChange={(e) => setMoveToSpace(e.target.value)}>
              <option value="">— choose —</option>
              {spaces.filter((s) => s.id !== currentSpaceId).map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.id}</option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn primary" disabled={!moveToSpace} onClick={onConfirm}>Move</button>
            <button className="btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
