import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/init-firebase";
import toast from "react-hot-toast";

import { usePrimaryAction } from "@/hooks/usePrimaryAction";
import { useThemeMode } from "@/hooks/useThemeMode";
import { setThemeMode, readTheme } from "@/utils/theme";
import { saveGreetingName, markLogin, makeGreeting } from "@/js/greeting-store";

import Icon from "@/components/Icon.jsx";

import TopbarSearch from "@/components/topbar/TopbarSearch.jsx";
import TopbarStatusPill from "@/components/topbar/TopbarStatusPill.jsx";
import Breadcrumbs from "@/components/topbar/Breadcrumbs.jsx";
import QuickActionsMenu from "@/components/topbar/QuickActionsMenu.jsx";
import NotificationsMenu from "@/components/topbar/NotificationsMenu.jsx";
import AvatarMenu from "@/components/topbar/AvatarMenu.jsx";
import FanModeToggle from "@/components/settings/FanModeToggle.jsx";

import RoleSwitcherTopbar from "@/components/topbar/RoleSwitcherTopbar.jsx"; // <-- NEW

import { useBreadcrumbs } from "@/components/topbar/useBreadcrumbs.js";
import { useTopbarShortcuts } from "@/components/topbar/useTopbarShortcuts.js";

/**
 * Topbar
 * - Accepts className for sticky styling from shells
 * - Accepts rightAccessory (e.g., sidebar toggle)
 * - Adds RoleSwitcherTopbar (visible for admin/creator)
 * - Adds “Refresh my role” action to force custom-claims refresh
 */
export default function Topbar({
  status,
  className = "",
  rightAccessory = null,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const primary = usePrimaryAction();
  const themeMode = useThemeMode();

  const [, setGreeting] = useState(makeGreeting());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const base = user.displayName || (user.email ? user.email.split("@")[0] : "");
        if (base) saveGreetingName(base);
        markLogin();
        const el = document.getElementById("sidebar-greeting");
        if (el) {
          el.textContent = `Bestie, ${base || "Bestie"}, Welcome Back!`;
          setGreeting(makeGreeting());
        }
      }
    });
    return () => unsub();
  }, []);

  const [hasPageTitle, setHasPageTitle] = useState(false);
  useEffect(() => {
    setHasPageTitle(!!document.querySelector(".page-title"));
  }, [location.pathname]);
  const { items: breadcrumbItems, hasItems } = useBreadcrumbs(location.pathname);

  const [q, setQ] = useState("");
  const [pending, setPending] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  function onSubmit(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setPending(true);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setMobileSearchOpen(false);
  }
  useEffect(() => {
    if (pending) setPending(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useTopbarShortcuts({ searchInputRef, primary });

  const pct = useMemo(() => {
    if (!status) return null;
    const m = status.match(/(\d{1,3})\s*%/);
    const n = m ? Math.max(0, Math.min(100, parseInt(m[1], 10))) : null;
    return Number.isFinite(n) ? n : null;
  }, [status]);

  const cycleTheme = () => {
    const cur = readTheme();
    const next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
    setThemeMode(next);
  };
  const themeIcon = themeMode === "dark" ? "sun" : themeMode === "light" ? "moon" : "sun-moon";

  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMobileSidebar = () => {
    const shell = document.querySelector(".app-shell");
    const open = shell?.getAttribute("data-sidebar") === "open";
    shell?.setAttribute("data-sidebar", open ? "" : "open");
    document.body.classList.toggle("body-lock", !open);
  };

  // NEW: force-refresh custom claims for current user
  async function refreshMyRole() {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Not signed in.");
        return;
      }
      toast.loading("Refreshing role…", { id: "refresh-role" });
      await user.getIdToken(true); // force token refresh
      toast.dismiss("refresh-role");
      toast.success("Role refreshed!");
      // Optional: warm your session cookie backend
      await fetch("/whoami", { credentials: "include" }).catch(() => {});
      // Soft reload so route guards re-evaluate claims
      setTimeout(() => window.location.reload(), 250);
    } catch {
      toast.dismiss("refresh-role");
      toast.error("Couldn’t refresh role.");
    }
  }

  return (
    <header
      id="topbar"
      className={`topbar ${compact ? "is-compact" : ""} ${className || ""}`}
      role="banner"
    >
      <a href="#main-content" className="skip-link">Skip to content</a>

      <div className="container">
        <div className="topbar__inner topbar--3col">
          {/* LEFT: breadcrumbs */}
          <div className="topbar__left">
            {!hasPageTitle && hasItems && <Breadcrumbs items={breadcrumbItems} />}
          </div>

          {/* CENTER: search or status */}
          <div className="topbar__center">
            {status ? (
              <TopbarStatusPill status={status} pct={pct} />
            ) : (
              <TopbarSearch
                q={q}
                pending={pending}
                inputRef={searchInputRef}
                onChange={setQ}
                onSubmit={onSubmit}
              />
            )}
          </div>

          {/* RIGHT: actions */}
          <div className="topbar__right">
            {rightAccessory}

            {!status && (
              <>
                <button
                  className="icon-btn show-on-mobile"
                  aria-label="Open menu"
                  title="Menu"
                  onClick={toggleMobileSidebar}
                >
                  <Icon name="menu" />
                </button>

                <QuickActionsMenu primary={primary} />

                <button
                  className="icon-btn show-on-mobile"
                  aria-label="Open search"
                  onClick={() => setMobileSearchOpen((v) => !v)}
                  title="Search"
                >
                  <Icon name="search" />
                </button>
              </>
            )}

            {/* Role switcher (admin/creator) */}
            <RoleSwitcherTopbar />

            {/* NEW: Refresh my role (desktop) */}
            <button
              className="btn sm ghost hide-on-mobile"
              type="button"
              onClick={refreshMyRole}
              title="Force-refresh your role claims"
              style={{ marginLeft: 6 }}
            >
              Refresh role
            </button>

            {/* Theme */}
            <button
              className="icon-btn"
              aria-label={`Theme: ${themeMode}`}
              title={`Theme: ${themeMode}`}
              onClick={cycleTheme}
            >
              <Icon name={themeIcon} />
            </button>

            {/* Fan mode, notifications, avatar */}
            <FanModeToggle compact />
            <NotificationsMenu />
            <AvatarMenu />
          </div>
        </div>
      </div>

      {!status && mobileSearchOpen && (
        <div className="mobile-search">
          <TopbarSearch
            q={q}
            pending={pending}
            inputRef={searchInputRef}
            onChange={setQ}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </header>
  );
}

