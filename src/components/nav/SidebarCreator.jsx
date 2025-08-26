import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Pin,
  Instagram,
  Youtube,
  MessageCircle,
  Timer,
  Layers3,
  ChartNoAxesCombined,
} from "lucide-react";

export default function SidebarCreator({ collapsed = false }) {
  const groups = [
    {
      title: "Creator Studio",
      items: [
        { to: "/creator/home", label: "Homepage", icon: Home },
        { to: "/creator/calendar", label: "Content Calendar", icon: CalendarDays },
        { to: "/creator/spaces", label: "Spaces", icon: Layers3 },
        { to: "/creator/insights", label: "Insights", icon: ChartNoAxesCombined },
      ],
    },
    {
      title: "Social",
      items: [
        { to: "/creator/pinterest", label: "Pinterest", icon: Pin },
        { to: "/creator/instagram", label: "Instagram", icon: Instagram },
        { to: "/creator/youtube", label: "Youtube", icon: Youtube },
        { to: "/creator/money-chat", label: "Money Chat", icon: MessageCircle },
        { to: "/creator/post-later", label: "Post Me Later", icon: Timer },
      ],
    },
  ];

  return (
    <nav
      className={`sidebar-nav ${collapsed ? "is-collapsed" : ""}`}
      aria-label="Creator navigation"
    >
      {groups.map((g) => (
        <div key={g.title}>
          {!collapsed && <div className="sidebar-section-title">{g.title}</div>}
          <ul className="sidebar-list" role="list">
            {g.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "is-active" : ""}`
                  }
                >
                  <Icon size={18} />
                  <span className="sidebar-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

