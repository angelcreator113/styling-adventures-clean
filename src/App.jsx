import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Guards
import { RequireAuth, PublicOnly } from "@/routes/guards.jsx";
import { RequireAnyRole } from "@/hooks/guards.jsx";

// Shells
import FanShell from "@/components/FanShell.jsx";
import CreatorShell from "@/components/CreatorShell.jsx";
import AdminShell from "@/components/AdminShell.jsx";

import { ROUTES } from "@/routes/constants";
import "@/css/styles/closet.css";

// Global toaster (styled)
import AppToaster from "@/components/ui/AppToaster.jsx";

// Eager
import LoginPage from "@/pages/LoginPage.jsx";

// Lazy pages
const Home                   = React.lazy(() => import("@/pages/HomeSwitcher.jsx"));
const UploadClosetPage       = React.lazy(() => import("@/pages/UploadClosetPage.jsx"));
const UploadVoicePage        = React.lazy(() => import("@/pages/UploadVoicePage.jsx"));
const UploadEpisodePage      = React.lazy(() => import("@/pages/UploadEpisodePage.jsx"));
const MetaPage               = React.lazy(() => import("@/pages/MetaPage.jsx"));
const StorageSmoke           = React.lazy(() => import("@/pages/StorageSmoke.jsx"));
const ForumThreadPage        = React.lazy(() => import("@/pages/ForumThreadPage.jsx"));

const OutfitBuilderPage      = React.lazy(() => import("@/pages/Sidebar/OutfitBuilderPage.jsx"));
const PlannerPage            = React.lazy(() => import("@/pages/Sidebar/PlannerPage.jsx"));
const SpotlightsPage         = React.lazy(() => import("@/pages/Sidebar/SpotlightsPage.jsx"));
const ForumPage              = React.lazy(() => import("@/pages/Sidebar/ForumPage.jsx"));
const ConfessionsPage        = React.lazy(() => import("@/pages/Sidebar/ConfessionsPage.jsx"));
const ChallengesPage         = React.lazy(() => import("@/pages/Sidebar/ChallengesPage.jsx"));
const VipPage                = React.lazy(() => import("@/pages/Sidebar/VipPage.jsx"));
const CalendarPage           = React.lazy(() => import("@/pages/Sidebar/CalendarPage.jsx"));

// Boards
const BoardsPage             = React.lazy(() => import("@/pages/BoardsPage.jsx"));
const PublicBoardPage        = React.lazy(() => import("@/pages/PublicBoardPage.jsx"));

// Admin manage
const AdminBoardsAnalytics   = React.lazy(() => import("@/pages/admin/manage/AdminBoardsAnalytics.jsx"));
const ChatManager            = React.lazy(() => import("@/pages/admin/manage/ChatManager.jsx"));
const ContentEditor          = React.lazy(() => import("@/pages/admin/manage/ContentEditor.jsx"));
const ThemesAdmin            = React.lazy(() => import("@/pages/admin/manage/ThemesAdmin.jsx"));
const AdminUsers             = React.lazy(() => import("@/pages/admin/manage/AdminUsers.jsx")); // NEW

// Admin content (legacy + new)
const AdminContentCloset     = React.lazy(() => import("@/pages/admin/content/AdminContentCloset.jsx")); // kept for redirect
const AdminContentEpisodes   = React.lazy(() => import("@/pages/admin/content/AdminContentEpisodes.jsx"));
const AdminContentClips      = React.lazy(() => import("@/pages/admin/content/AdminContentClips.jsx"));
const AdminSpacesDashboard   = React.lazy(() => import("@/pages/admin/content/AdminSpacesDashboard.jsx")); // NEW

// Home pages
const AdminHome              = React.lazy(() => import("@/pages/home/AdminHome.jsx"));
const CreatorHome            = React.lazy(() => import("@/pages/home/CreatorHome.jsx"));

// Creator Studio
const CreatorPinterestPage   = React.lazy(() => import("@/pages/creator/CreatorPinterestPage.jsx"));
const CreatorInstagramPage   = React.lazy(() => import("@/pages/creator/CreatorInstagramPage.jsx"));
const CreatorYoutubePage     = React.lazy(() => import("@/pages/creator/CreatorYoutubePage.jsx"));
const CreatorBoardsAnalytics = React.lazy(() => import("@/pages/creator/CreatorBoardsAnalytics.jsx"));
const CreatorCalendarPage    = React.lazy(() => import("@/pages/creator/CreatorCalendarPage.jsx"));
const CreatorPostLaterPage   = React.lazy(() => import("@/pages/admin/manage/CreatorPostLaterPage.jsx"));

// Creator Spaces
const CreatorSpacesIndex     = React.lazy(() => import("@/pages/creator/spaces/CreatorSpacesIndex.jsx"));
const CreatorSpaceDetail     = React.lazy(() => import("@/pages/creator/spaces/CreatorSpaceDetail.jsx"));
const SpaceUpload            = React.lazy(() => import("@/pages/creator/spaces/SpaceUpload.jsx"));

const Fallback = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card" role="status" aria-live="polite" style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #ccc", borderTopColor: "#7c3aed", animation: "spin .9s linear infinite" }} />
      <span>Loading…</span>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </section>
);

const NotFound = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card">
      <h1 style={{ margin: 0 }}>404 — Page not found</h1>
      <p style={{ marginTop: 8 }}><a href="/home">Go to Home</a></p>
    </div>
  </section>
);

const Unauthorized = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card">
      <h1 style={{ margin: 0 }}>Unauthorized</h1>
      <p style={{ marginTop: 8 }}>You don’t have access to that page.</p>
    </div>
  </section>
);

export default function App() {
  return (
    <>
      <AppToaster />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* PUBLIC */}
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/b/:uid/:boardId" element={<PublicBoardPage />} />

          {/* ================= FAN SHELL ================= */}
          <Route
            element={
              <RequireAuth>
                <FanShell />
              </RequireAuth>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/closet" element={<UploadClosetPage />} />
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/outfits/builder" element={<OutfitBuilderPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/community/spotlights" element={<SpotlightsPage />} />
            <Route path="/community/forum" element={<ForumPage />} />
            <Route path="/community/confessions" element={<ConfessionsPage />} />
            <Route path="/community/challenges" element={<ChallengesPage />} />
            <Route path="/vip" element={<VipPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/community/forum/:id" element={<ForumThreadPage />} />
          </Route>

          {/* ============== CREATOR SHELL (creator + admin) ============== */}
          <Route
            element={
              <RequireAuth>
                <RequireAnyRole allow={["creator", "admin"]}>
                  <CreatorShell />
                </RequireAnyRole>
              </RequireAuth>
            }
          >
            <Route path="/creator/home" element={<CreatorHome />} />
            <Route path="/creator/calendar" element={<CreatorCalendarPage />} />
            <Route path="/creator/pinterest" element={<CreatorPinterestPage />} />
            <Route path="/creator/instagram" element={<CreatorInstagramPage />} />
            <Route path="/creator/youtube" element={<CreatorYoutubePage />} />
            <Route path="/creator/money-chat" element={<ForumPage />} />
            <Route path="/creator/post-later" element={<CreatorPostLaterPage />} />

            {/* Creator Spaces */}
            <Route path="/creator/spaces" element={<CreatorSpacesIndex />} />
            <Route path="/creator/spaces/:spaceId" element={<CreatorSpaceDetail />} />
            <Route path="/creator/spaces/:spaceId/upload" element={<SpaceUpload />} />

            {/* Voice & Episodes */}
            <Route path="/voice" element={<UploadVoicePage />} />
            <Route path="/episodes" element={<UploadEpisodePage />} />
            <Route path="/creator/insights" element={<CreatorBoardsAnalytics />} />
          </Route>

          {/* ================= ADMIN SHELL (admin only) ================= */}
          <Route
            element={
              <RequireAuth>
                <RequireAnyRole allow={["admin"]}>
                  <AdminShell />
                </RequireAnyRole>
              </RequireAuth>
            }
          >
            <Route path="/admin/home" element={<AdminHome />} />

            {/* NEW: Users / Roles management */}
            <Route path="/admin/users" element={<AdminUsers />} />

            {/* NEW: Spaces dashboard */}
            <Route path="/admin/spaces" element={<AdminSpacesDashboard />} />

            {/* Existing admin content routes */}
            <Route path={ROUTES.adminSpaces} element={<AdminContentCloset />} />
            <Route path="/admin/chat" element={<ChatManager />} />
            <Route path="/admin/boards" element={<AdminBoardsAnalytics />} />
            <Route path="/admin/themes" element={<ThemesAdmin />} />
            <Route path="/admin/content/episodes" element={<AdminContentEpisodes />} />
            <Route path="/admin/content/clips" element={<AdminContentClips />} />
            <Route path="/meta" element={<MetaPage />} />
            <Route path="/storage-smoke" element={<StorageSmoke />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/admin/content/closet" element={<Navigate to={ROUTES.adminSpaces} replace />} />
          <Route path="/closet/upload" element={<Navigate to="/closet" replace />} />
          <Route path="/closet/dashboard" element={<Navigate to="/closet" replace />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
