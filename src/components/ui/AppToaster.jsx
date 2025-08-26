// src/components/ui/AppToaster.jsx
import React from "react";
import { Toaster } from "react-hot-toast";

/**
 * One global toaster, styled to match your system:
 * - rounded-xl
 * - soft shadow
 * - brand accent for success/info
 * - subtle red for errors
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      toastOptions={{
        // base styles
        style: {
          borderRadius: "12px",
          padding: "10px 12px",
          background: "var(--surface, #0f1220)",
          color: "var(--text, #fff)",
          border: "1px solid rgba(255,255,255,.08)",
          boxShadow: "0 8px 24px rgba(0,0,0,.25)",
        },
        duration: 3500,
        // variants
        success: {
          duration: 2800,
          iconTheme: { primary: "#7c3aed", secondary: "#ffffff" }, // purple brand
          style: { borderColor: "rgba(124,58,237,.45)" },
        },
        error: {
          duration: 4200,
          iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
          style: { borderColor: "rgba(239,68,68,.45)", background: "rgba(239,68,68,.08)" },
        },
        // you can call toast.custom too (kept default)
      }}
    />
  );
}
