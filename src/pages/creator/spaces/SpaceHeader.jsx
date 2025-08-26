import React, { useRef } from "react";

/** Props
 * space {name, coverUrl, lastPreviewUrl}
 * status, onStatusChange(v)
 * onSearchChange(v)
 * onAllSpaces()
 * onPickCover(file)
 */
export default function SpaceHeader({
  space,
  status = "active",
  onStatusChange,
  onSearchChange,
  onAllSpaces,
  onPickCover,
}) {
  const fileRef = useRef(null);
  const cover =
    space?.coverUrl || space?.lastPreviewUrl || "/images/placeholder-cover.png";

  return (
    <header>
      {/* Wide banner */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "21 / 9",       // cover proportions
          borderRadius: 16,
          overflow: "hidden",
          background: `#f6f6ff url("${cover}") center/cover no-repeat`,
          border: "1px solid #eee",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,.35), rgba(0,0,0,.05))"
          }}
        />

        {/* Change cover */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onPickCover?.(f);
            }}
          />
          <button className="btn sm" onClick={() => fileRef.current?.click()}>
            Change cover
          </button>
        </div>

        {/* Title on cover */}
        <div style={{ position: "absolute", left: 16, bottom: 12, right: 16 }}>
          <div className="muted" style={{ color: "white", opacity: .9, fontSize: 12, marginBottom: 4 }}>
            Space
          </div>
          <h1 className="page-title" style={{ color: "white", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,.35)" }}>
            {space?.name || "—"}
          </h1>
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="dashboard-card"
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "220px 1fr auto",
          gap: 10,
          alignItems: "center",
        }}
      >
        <select className="select" value={status} onChange={(e)=>onStatusChange?.(e.target.value)}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <input className="input__field" placeholder="Search title or file…" onChange={(e)=>onSearchChange?.(e.target.value)} />
        <button className="btn" onClick={onAllSpaces}>All Spaces</button>
      </div>
    </header>
  );
}
