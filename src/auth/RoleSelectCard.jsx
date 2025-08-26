// src/components/auth/RoleSelectCard.jsx
import React from "react";
import { Check } from "lucide-react";

/** Small, pretty card for role options */
export default function RoleSelectCard({
  role, title, desc, price, selected, onSelect, highlight = false, perks = [],
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`role-card ${selected ? "is-selected" : ""}`}
      aria-pressed={selected}
      style={{
        textAlign: "left",
        borderRadius: 14,
        padding: 16,
        border: `2px solid ${selected ? "var(--indigo-500, #6366f1)" : "rgba(0,0,0,.08)"}`,
        background: highlight ? "linear-gradient(180deg,#faf5ff,#fff)" : "#fff",
        boxShadow: selected ? "0 6px 18px rgba(99,102,241,.18)" : "0 1px 4px rgba(0,0,0,.04)",
        cursor: "pointer",
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{title}</div>
          <div className="muted" style={{ marginTop: 4 }}>{desc}</div>
        </div>
        <div style={{ fontWeight: 700, color: "var(--indigo-600,#4f46e5)" }}>{price}</div>
      </div>

      {!!perks?.length && (
        <ul style={{ margin: "12px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
          {perks.map(p => (
            <li key={p} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Check size={16} /> <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="badge" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 12,
          background: "var(--indigo-50,#eef2ff)",
          color: "var(--indigo-700,#4338ca)",
          borderRadius: 999,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 600,
        }}>
          <Check size={14} /> Selected
        </div>
      )}
    </button>
  );
}
