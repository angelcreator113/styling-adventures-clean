import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Shirt,
  PanelsTopLeft,
  Wand2,
  CalendarDays,
  Sparkles,
  MessageCircle,
  Ghost,
  Trophy,
  Star,
} from "lucide-react";

export default function SidebarFan({ collapsed = false }) {
  const items = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/closet", label: "Closet", icon: Shirt },
    { to: "/boards", label: "Boards", icon: PanelsTopLeft },
    { to: "/outfits/builder", label: "Outfit Builder", icon: Wand2 },
    { to: "/planner", label: "Planner", icon: CalendarDays },
    { to: "/community/spotlights", label: "Top Picks", icon: Sparkles },
    { to: "/community/forum", label: "Forum", icon: MessageCircle },
    { to: "/community/confessions", label: "Confessions", icon: Ghost },
    { to: "/community/challenges", label: "Challenges", icon: Trophy },
    { to: "/vip", label: "VIP", icon: Star },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/the-bestie-lounge", label: "The Bestie Lounge", icon: Sparkles },
  ];

  return (
    <nav
      className={`sidebar-nav ${collapsed ? "is-collapsed" : ""}`}
      aria-label="Fan navigation"
    >
      <ul className="sidebar-list" role="list">
        {items.map(({ to, label, icon: Icon }) => (
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
    </nav>
  );
}

