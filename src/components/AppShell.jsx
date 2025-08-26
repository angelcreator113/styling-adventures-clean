// src/components/AppShell.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";

import Topbar from "./topbar/Topbar.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";

import { auth, db } from "@/utils/init-firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/**
 * Small helpers to read form values by element id.
 * Safe if an element is missing (returns empty string / false).
 */
const v = (id) => document.getElementById(id)?.value?.trim() || "";
const b = (id) => !!document.getElementById(id)?.checked;

export default function AppShell() {
  // Persist upload meta events from various upload panels across the app.
  useEffect(() => {
    const onComplete = async (e) => {
      const d = e.detail || {};
      const prefix = d.uiPrefix;
      if (!prefix || d._metaPersisted) return; // ignore duplicates

      const user = auth.currentUser;
      if (!user) return;

      // Map a known uiPrefix -> Firestore subcollection and field reader
      const map = {
        "closet-": {
          path: `users/${user.uid}/closet`,
          fields: () => ({
            title: v("closet-title"),
            notes: v("closet-notes"),
            category: v("closet-category"),
            subcategory: v("closet-subcategory"),
            subsubcategory: v("closet-subsubcategory"),
            visibility: b("closet-is-public") ? "public" : "private",
          }),
        },
        "voice-": {
          path: `users/${user.uid}/voice`,
          fields: () => ({
            title: v("voice-title"),
            notes: v("voice-notes"),
            category: v("voice-category"),
            subcategory: v("voice-subcategory"),
            subsubcategory: v("voice-subsubcategory"),
            visibility: b("voice-is-public") ? "public" : "private",
          }),
        },
        // Accept either episode- or episodes- for robustness
        "episode-": {
          path: `users/${user.uid}/episodes`,
          fields: () => ({
            title: v("episode-title") || v("episodes-title"),
            notes: v("episode-notes") || v("episodes-notes"),
            category: v("episode-category") || v("episodes-category"),
            subcategory: v("episode-subcategory") || v("episodes-subcategory"),
            subsubcategory: v("episode-subsubcategory") || v("episodes-subsubcategory"),
            visibility: b("episode-is-public") ? "public" : "private",
          }),
        },
        "episodes-": {
          path: `users/${user.uid}/episodes`,
          fields: () => ({
            title: v("episodes-title") || v("episode-title"),
            notes: v("episodes-notes") || v("episode-notes"),
            category: v("episodes-category") || v("episode-category"),
            subcategory: v("episodes-subcategory") || v("episode-subcategory"),
            subsubcategory: v("episodes-subsubcategory") || v("episode-subsubcategory"),
            visibility: b("episode-is-public") ? "public" : "private",
          }),
        },
      };

      // Normalize unknown prefixes that start with "episode"
      const entry =
        map[prefix] ||
        (prefix.startsWith("episode") ? map["episode-"] : null);

      if (!entry) return;

      try {
        const payload = {
          uid: user.uid,
          ...entry.fields(),
          fileName: d.fileName || "",
          url: d.url || "",
          storagePath: d.path || "",
          uploadedAt: serverTimestamp(),
        };
        await addDoc(collection(db, entry.path), payload);
        d._metaPersisted = true; // flag so repeating events are ignored
      } catch (err) {
        console.error("[AppShell] failed to save upload metadata:", err);
      }
    };

    document.addEventListener("upload:complete", onComplete);
    return () => document.removeEventListener("upload:complete", onComplete);
  }, []);

  return (
    <div className="app-shell">
      {/* Global topbar kept for shared actions (profile, notifications, etc.) */}
      <Topbar />

      {/* No global Sidebar here — sidebars now live in FanShell / CreatorShell / AdminShell */}
      <main id="main-content" className="app-main" role="main" aria-live="polite">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
