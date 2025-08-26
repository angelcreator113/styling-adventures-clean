# Wiring the new upload pages into routes

In `src/app.jsx`, replace the stub routes with the new pages and dashboards:

```jsx
import UploadClosetPage from "@/pages/UploadClosetPage.jsx";
import UploadVoicePage from "@/pages/UploadVoicePage.jsx";
import UploadEpisodePage from "@/pages/UploadEpisodePage.jsx";
import ClosetDashboard from "@/components/ClosetDashboard.jsx";
import VoiceDashboard from "@/components/VoiceDashboard.jsx";
import EpisodeDashboard from "@/components/EpisodeDashboard.jsx";

// inside <Route element={<AppShell />}> ...

<Route path="/closet" element={<UploadClosetPage />} />
<Route path="/voice" element={<UploadVoicePage />} />
<Route path="/episodes" element={<UploadEpisodePage />} />
<Route path="/meta" element={<MetaPage />} />
```

Remove any script tags or HTML loaders related to the legacy panel system (panel-router, seed registry, form-injector).
