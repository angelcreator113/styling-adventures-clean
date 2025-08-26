// src/components/LogoutModal.jsx
import React from 'react';

export default function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="logout-modal">
      <div className="logout-modal-content">
        <h2>Are you sure you want to log out?</h2>
        <div className="logout-modal-actions">
          <button className="button-base button-confirm" onClick={onConfirm}>
            Yes, Logout
          </button>
          <button className="button-base button-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
