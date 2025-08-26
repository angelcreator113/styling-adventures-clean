// CreatorSpaceDetail.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import useUid from "@/hooks/spaces/useUid";
import useSpaceDoc from "@/hooks/spaces/useSpaceDoc";
import useCatsFolders from "@/hooks/spaces/useCatsFolders";
import useItemsCG from "@/hooks/spaces/useItemsCG";
import useSetCover from "@/hooks/spaces/useSetCover";
import useItemActions from "@/hooks/spaces/useItemActions";

import SpaceHeader from "./SpaceHeader.jsx";
import SpaceUpload from "./SpaceUpload.jsx";
import SpaceGrid from "./SpaceGrid.jsx";
import ProgressDot from "./ProgressDot.jsx";
import SpaceLayout from "@/components/spaces/SpaceLayout.jsx";


const STATUS_OPTIONS = ["all", "active", "archived"];
const SORT_OPTIONS = [
  { value: "new", label: "Newest" },
  { value: "old", label: "Oldest" },
  { value: "az", label: "A–Z" },
  { value: "za", label: "Z–A" },
];

export default function CreatorSpaceDetail() {
  const { spaceId: routeSpaceId, id } = useParams();
  const navigate = useNavigate();
  const spaceId = routeSpaceId || id;

  const { uid, loading: uidLoading } = useUid();
  const { space, loading: spaceLoading, missing } = useSpaceDoc(uid, spaceId);

  const [status, setStatus] = useState("active");
  const [qText, setQText] = useState("");
  const [catId, setCatId] = useState("");
  const [folderId, setFolderId] = useState("");
  const [sortKey, setSortKey] = useState("new");

  const { cats, folders, addCategory, addFolder } = useCatsFolders(uid, spaceId, catId);
  const { items, count, indexPending } = useItemsCG({ uid, spaceId, catId, folderId, status, qText });

  const setCover = useSetCover(uid, spaceId);
  const { toggleArchive, deleteItem, renameItem } = useItemActions(uid, spaceId);

  const uploadRef = useRef(null);
  const loading = uidLoading || spaceLoading;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aT = a.createdAt?.seconds || 0;
      const bT = b.createdAt?.seconds || 0;
      if (sortKey === "az") return (a.title || "").localeCompare(b.title || "");
      if (sortKey === "za") return (b.title || "").localeCompare(a.title || "");
      if (sortKey === "old") return aT - bT;
      return bT - aT;
    });
  }, [items, sortKey]);

  const [selected, setSelected] = useState(new Set());
  const selectedCount = selected.size;

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const selectAllVisible = useCallback(
    () => setSelected(new Set(sortedItems.map((i) => i.id))),
    [sortedItems]
  );

  const bulkArchiveOrRestore = async (to = "archived") => {
    const map = new Map(sortedItems.map((i) => [i.id, i]));
    await Promise.all(
      Array.from(selected).map((id) => {
        const it = map.get(id);
        if (!it) return Promise.resolve();
        const want = to === "archived";
        const isArchived = (it.status || "active") !== "active";
        return want !== isArchived ? toggleArchive(it) : Promise.resolve();
      })
    );
    clearSelection();
  };

  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} item(s)?`)) return;
    const map = new Map(sortedItems.map((i) => [i.id, i]));
    await Promise.all(Array.from(selected).map((id) => deleteItem(map.get(id))));
    clearSelection();
  };

  useEffect(() => {
    if (!uidLoading && !spaceLoading && (missing || (spaceId && !space))) {
      navigate("/creator/spaces", { replace: true });
    }
  }, [uidLoading, spaceLoading, missing, space, spaceId, navigate]);

  useEffect(() => {
    if (!loading && sortedItems.length === 0 && uploadRef.current) {
      uploadRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, sortedItems.length]);

  return (
    <section className="container space-detail" style={{ padding: 16 }}>
      {loading && <div>Loading…</div>}
      {!loading && space && (
        <>
          <SpaceHeader
            space={space}
            status={status}
            onStatusChange={setStatus}
            onSearchChange={setQText}
            onAllSpaces={() => navigate("/creator/spaces")}
            onPickCover={(file) =>
              setCover(file).catch(() => alert("Could not update the cover image."))
            }
            rightAccessory={indexPending && <ProgressDot title="Building index…" />}
          />

          <SpaceLayout
            aside={
              <div ref={uploadRef}>
                <SpaceUpload
                  compact
                  spaceName={space.name || "Space"}
                  uid={uid}
                  spaceId={spaceId}
                  cats={cats}
                  folders={folders}
                  catId={catId}
                  setCatId={(v) => {
                    setCatId(v);
                    setFolderId("");
                  }}
                  folderId={folderId}
                  setFolderId={setFolderId}
                  addCategory={addCategory}
                  addFolder={addFolder}
                />
              </div>
            }
          >
            <div className="dashboard-card" style={{ padding: 12 }}>
              <div className="space-toolbar">
                <div className="pill-row">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      className={`pill ${status === s ? "is-active" : ""}`}
                      onClick={() => setStatus(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="muted count-label">
                  {selectedCount > 0 ? `${selectedCount} selected` : `${count} item(s)`}
                </div>
                <div />
                <label className="sort-label">
                  <span className="muted">Sort</span>
                  <select
                    className="select"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="bulk-actions">
                  <button className="btn sm" onClick={selectAllVisible}>Select all</button>
                  <button className="btn sm" onClick={clearSelection} disabled={!selectedCount}>Clear</button>
                  <button className="btn sm" onClick={() => bulkArchiveOrRestore("archived")} disabled={!selectedCount}>Archive</button>
                  <button className="btn sm" onClick={() => bulkArchiveOrRestore("active")} disabled={!selectedCount}>Restore</button>
                  <button className="btn sm danger" onClick={bulkDelete} disabled={!selectedCount}>Delete</button>
                </div>
              </div>

              {indexPending && (
                <div className="dashboard-card index-warning">
                  <div style={{ fontWeight: 600 }}>Building search index…</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Firestore is creating the index. Items will appear soon.
                  </div>
                </div>
              )}

              {sortedItems.length === 0 ? (
                <div className="dashboard-card empty-space">
                  No items yet in this Space. Use the panel on the left to upload.
                </div>
              ) : (
                <SpaceGrid
                  items={sortedItems.slice(0, 10)}
                  onArchive={toggleArchive}
                  onDelete={deleteItem}
                  onRename={async (item) => {
                    const newTitle = prompt("New title?", item.title || "");
                    if (newTitle != null) {
                      await renameItem(item, newTitle.trim());
                    }
                  }}
                  selectedIds={selected}
                  onToggleSelect={toggleSelect}
                />
              )}
            </div>
          </SpaceLayout>
        </>
      )}
    </section>
  );
}
