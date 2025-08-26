import React from "react";

/**
 * Responsive card grid to display uploaded items.
 *
 * Props:
 * - items: array of item objects ({ id, title, previewUrl, fileUrl, status, contentType })
 * - onArchive(item), onDelete(item), onRename(item): actions
 * - selectedIds: Set<string> of selected item IDs
 * - onToggleSelect(id): toggles selection
 */
export default function SpaceGrid({
  items = [],
  onArchive,
  onDelete,
  onRename,
  selectedIds = new Set(),
  onToggleSelect = () => {},
}) {
  return (
    <div
      className="space-grid"
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        alignItems: "start",
      }}
    >
      {items.map((it) => {
        const isArchived = (it.status || "active") !== "active";
        const isSelected = selectedIds.has(it.id);
        const media = pickMediaType(it);

        return (
          <article
            key={it.id}
            className={`space-card ${isSelected ? "is-selected" : ""}`}
            style={{
              padding: 8,
              borderRadius: 12,
              border: "1px solid #eee",
              background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              position: "relative",
            }}
          >
            {/* Selection checkbox */}
            <label
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "#fff",
                borderRadius: 8,
                padding: 4,
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                display: "grid",
                placeItems: "center",
              }}
              title={isSelected ? "Unselect" : "Select"}
            >
              <input
                type="checkbox"
                checked={!!isSelected}
                onChange={() => onToggleSelect(it.id)}
              />
            </label>

            {/* Media preview */}
            <div
              style={{
                width: "100%",
                aspectRatio: "3 / 4",
                borderRadius: 10,
                border: "1px solid #eee",
                overflow: "hidden",
                background: "#fafafa",
                display: "grid",
                placeItems: "center",
              }}
            >
              {media === "video" ? (
                <video
                  src={it.previewUrl || it.fileUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                  controls
                />
              ) : media === "audio" ? (
                <div style={{ padding: 12, width: "100%" }}>
                  <audio src={it.fileUrl} controls style={{ width: "100%" }} />
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `#fff url("${
                      it.previewUrl || it.fileUrl || ""
                    }") center/cover no-repeat`,
                  }}
                />
              )}
            </div>

            {/* Title & actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
                gap: 8,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={it.title || "Item"}
              >
                {it.title || "Item"}
                {isArchived && (
                  <span className="muted" style={{ fontSize: 12, marginLeft: 6 }}>
                    (archived)
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn sm" onClick={() => onRename(it)}>
                  Rename
                </button>
                <button className="btn sm" onClick={() => onArchive(it)}>
                  {isArchived ? "Restore" : "Archive"}
                </button>
                <button className="btn sm danger" onClick={() => onDelete(it)}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/**
 * Determines media type for rendering preview:
 * - Checks contentType (MIME)
 * - Fallback to file extension
 */
function pickMediaType(it) {
  const ct = (it.contentType || "").toLowerCase();
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("audio/")) return "audio";
  const url = it.fileUrl || it.previewUrl || "";
  if (/\.(mp4|webm|mov)$/i.test(url)) return "video";
  if (/\.(mp3|wav|m4a|aac|ogg)$/i.test(url)) return "audio";
  return "image";
}
