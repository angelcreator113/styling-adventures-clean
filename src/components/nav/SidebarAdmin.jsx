import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCog,
  BarChart3,
  Palette,
  MessageSquare,
  Video,
  Film,
  Wrench,
  Database,
  Layers3,
} from "lucide-react";

/**
 * ADMIN SIDEBAR (pretty version)
 * - Section headers
 * - Icons
 * - Active state
 * - Collapsible width via parent prop
 */
export default function SidebarAdmin({ collapsed = false }) {
  const groups = [
    {
      title: "Admin",
      items: [
        { to: "/admin/home", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/users", label: "Users (Roles)", icon: UserCog }, // NEW
        { to: "/admin/boards", label: "Boards", icon: BarChart3 },
        { to: "/admin/themes", label: "Themes", icon: Palette },
        { to: "/admin/chat", label: "Chat Manager", icon: MessageSquare },
      ],
    },
    {
      title: "Content",
      items: [
        { to: "/admin/spaces", label: "Spaces (All creators)", icon: Layers3 }, // NEW dashboard
        { to: "/admin/content/episodes", label: "Episodes", icon: Film },
        { to: "/admin/content/clips", label: "Clips", icon: Video },
      ],
    },
    {
      title: "Tools",
      items: [
        { to: "/meta", label: "Meta & Tools", icon: Wrench },
        { to: "/storage-smoke", label: "Storage Smoke", icon: Database },
      ],
    },
  ];

  return (
    <nav
      className={`sidebar-nav ${collapsed ? "is-collapsed" : ""}`}
      aria-label="Admin navigation"
    >
      {groups.map((g) => (
        <div key={g.title} className="sidebar-section">
          {!collapsed && (
            <div className="sidebar-section-title" aria-hidden>
              {g.title}
            </div>
          )}
          <ul className="sidebar-list" role="list">
            {g.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "is-active" : ""}`
                  }
                >
                  <Icon size={18} className="sidebar-link__icon" aria-hidden />
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
