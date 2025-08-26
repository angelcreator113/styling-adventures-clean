// src/hooks/usePrimaryAction.js
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function usePrimaryAction() {
  const location = useLocation();
  const navigate = useNavigate();

  // Map routes → action label + handler
  const map = useMemo(() => ({
    "/home":        { label: "＋ New",         to: "/upload/closet" },
    "/":            { label: "＋ New",         to: "/upload/closet" },
    "/closet":      { label: "＋ Add Item",    to: "/upload/closet" },
    "/voice":       { label: "＋ New Voice",   to: "/upload/voice" },
    "/episodes":    { label: "＋ New Episode", to: "/upload/episodes" },
    "/meta":        { label: "Open Settings",  to: "/settings" },
    "/manage-panels": { label: "Manage Panels", to: "/manage-panels" },
  }), []);

  // find best key by prefix match
  const path = location.pathname.toLowerCase();
  const entry =
    Object.entries(map).find(([key]) => path === key) ||
    Object.entries(map).find(([key]) => path.startsWith(key)) ||
    Object.entries(map).find(([key]) => key === "/home");

  const action = entry?.[1] ?? { label: "＋ New", to: "/upload/closet" };

  return {
    label: action.label,
    onClick: () => navigate(action.to),
  };
}
