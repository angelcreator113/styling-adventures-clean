import React from "react";
import Icon from "@/components/Icon";

export default function SidebarToggle({ pressed, onClick, btnRef, title }) {
  return (
    <button
      ref={btnRef}
      className="icon-btn"
      aria-label={pressed ? "Expand sidebar" : "Collapse sidebar"}
      aria-pressed={pressed}
      onClick={onClick}
      title={title || (pressed ? "Expand sidebar" : "Collapse sidebar")}
    >
      <Icon name="menu" />
    </button>
  );
}
