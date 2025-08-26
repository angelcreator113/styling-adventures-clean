// src/pages/creator/spaces/ProgressDot.jsx
import React from "react";

/** state: "idle" | "building" | "ok"  */
export default function ProgressDot({ state = "idle", label = "" }) {
  const color = state === "building" ? "#f59e0b" : state === "ok" ? "#10b981" : "#cbd5e1";
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: "0 0 0 2px #fff",
        verticalAlign: "middle",
      }}
    />
  );
}
