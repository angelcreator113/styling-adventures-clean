import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/utils/init-firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { processImageBlob } from "@/utils/image-pipeline";
import { uploadFileWithProgress } from "@/utils/firebase-helpers";


/**
 * Upload panel component for Creator Spaces.
 * Supports:
 * - Drag & drop or click-to-upload
 * - File type picker (photo, video, audio)
 * - Side-by-side preview of media
 * - Progress indicator and retry/clear
 */
export default function SpaceUpload({
  spaceName = "Space",
  uid,
  spaceId,
  cats = [],
  folders = [],
  catId = "",
  setCatId = () => {},
  folderId = "",
  setFolderId = () => {},
  addCategory,
  addFolder,
  compact = false,
}) {
  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const processedRef = useRef(null); // Stores processed blobs for upload

  // UI states
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [kind, setKind] = useState("image"); // Allowed kinds: 'image' | 'video' | 'audio'

  // Setup drag & drop events for drop target
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const over = (e) => {
      e.preventDefault();
      el.classList.add("is-hover");
    };
    const leave = () => el.classList.remove("is-hover");
    const drop = (e) => {
      e.preventDefault();
      el.classList.remove("is-hover");
      const f = e.dataTransfer.files?.[0];
      if (f) handlePickedFile(f);
    };

    el.addEventListener("dragover", over);
    el.addEventListener("dragleave", leave);
    el.addEventListener("drop", drop);

    return () => {
      el.removeEventListener("dragover", over);
      el.removeEventListener("dragleave", leave);
      el.removeEventListener("drop", drop);
    };
  }, []);

  // Accept attribute for <input> based on kind
  const acceptAttr = useMemo(() => {
    if (kind === "video") return "video/*";
    if (kind === "audio") return "audio/*";
    return "image/*";
  }, [kind]);

  // Launch file picker dialog
  function openPicker() {
    inputRef.current?.click();
  }

  function onPick(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) handlePickedFile(f);
  }

  // Handle a file picked or dropped
  async function handlePickedFile(file) {
    try {
      setBusy(true);
      setPct(0);
      setReady(false);
      setFileName(file.name || "file");

      if (kind === "image") {
        // Use image pipeline for resizing, icons, preview etc.
        const out = await processImageBlob(file, {
          smartCompress: true,
          trimBg: false, // Keep background visible
          padToSquare: true,
          preferServer: true,
          exportPreview: true,
          exportIcon: true,
          exportIconHover: true,
        });

        processedRef.current = {
          kind: "image",
          uploadBlob: out.cutoutBlob,
          previewBlob: out.previewBlob,
          iconBlob: out.iconBlob,
          iconHoverBlob: out.iconHoverBlob,
        };

        const pUrl =
          out.previewUrl ||
          (out.previewBlob ? URL.createObjectURL(out.previewBlob) : "");
        setPreviewUrl(pUrl);
      } else {
        // For video/audio, bypass processing
        processedRef.current = {
          kind,
          uploadBlob: file,
        };
        setPreviewUrl(URL.createObjectURL(file));
      }

      setReady(true);

      if (!title) {
        const base = (file.name || "").replace(/\.[^.]+$/, "");
        setTitle(base || `File ${new Date().toLocaleString()}`);
      }
    } catch (err) {
      console.warn("[spaces] process failed", err);
      alert("Couldn’t process that file.");
    } finally {
      setBusy(false);
    }
  }

  function clearPicked() {
    processedRef.current = null;
    setTitle("");
    setFileName("");
    setPreviewUrl("");
    setReady(false);
    setPct(0);
  }

  // Handle upload action
  async function handleUpload() {
    if (!uid || !spaceId) return alert("Please sign in.");
    const P = processedRef.current;
    if (!P?.uploadBlob) return alert("Choose a file first.");

    try {
      setBusy(true);
      setPct(1);

      const pathPrefix = `images/users/${uid}/spaces/${spaceId}`;
      const isImage = P.kind === "image";

      const res = await uploadFileWithProgress(P.uploadBlob, {
        slug: "spaces",
        pathPrefix,
        public: false,
        uiPrefix: "space-up",
        onProgress: (v) => setPct(Math.round(v || 0)),
        metadata: {
          uid,
          spaceId,
          catId: catId || "",
          folderId: folderId || "",
          title: title || "Item",
          visibility: "private",
          mediaType: P.kind,
          contentType:
            (isImage ? "image/png" : P.uploadBlob.type) || "application/octet-stream",
          cacheControl: "public,max-age=31536000",
        },
        extraUploads: isImage
          ? [
              { key: "preview", blob: P.previewBlob, contentType: "image/jpeg" },
              { key: "icon", blob: P.iconBlob, contentType: "image/png" },
              {
                key: "iconHover",
                blob: P.iconHoverBlob,
                contentType: "image/png",
              },
            ]
          : [],
      });

      const fileUrl = res?.downloadURL || res?.url || res?.assets?.file?.url || "";
      const previewURL = isImage
        ? res?.assets?.preview?.url || ""
        : fileUrl;

      // Determine Firestore target collection
      let targetCol;
      if (catId && folderId) {
        targetCol = collection(
          db,
          `users/${uid}/spaces/${spaceId}/categories/${catId}/folders/${folderId}/items`
        );
      } else if (catId) {
        targetCol = collection(
          db,
          `users/${uid}/spaces/${spaceId}/categories/${catId}/items`
        );
      } else {
        targetCol = collection(db, `users/${uid}/spaces/${spaceId}/items`);
      }

      // Add item document
      await addDoc(targetCol, {
        uid,
        spaceId,
        catId: catId || null,
        folderId: folderId || null,
        title: title || null,
        fileName: res?.fileName || fileName || null,
        fileUrl: fileUrl || null,
        previewUrl: previewURL || null,
        storagePath: res?.fullPath || null,
        contentType: (isImage ? "image/png" : P.uploadBlob.type) || null,
        mediaType: P.kind || "image",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update parent space metadata
      try {
        await updateDoc(doc(db, `users/${uid}/spaces/${spaceId}`), {
          fileCount: increment(1),
          updatedAt: serverTimestamp(),
          lastPreviewUrl: previewURL || fileUrl || null,
        });
      } catch {}

      clearPicked();
    } catch (err) {
      console.warn("[spaces] upload failed", err);
      alert(`Upload failed for ${fileName || "file"}. See console.`);
    } finally {
      setBusy(false);
    }
  }

  // Upload button enabled state
  const canUpload = useMemo(() => ready && !busy && pct === 0, [ready, busy, pct]);

  return (
    <div className="dashboard-card" style={{ padding: 12 }}>
      <h3 style={{ margin: "4px 0 10px" }}>Upload to “{spaceName}”</h3>

      {/* Media type selector */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <span className="muted" style={{ fontSize: 12 }}>File type</span>
        <div className="seg" style={{ display: "flex", gap: 6 }}>
          {[
            { key: "image", label: "Photo" },
            { key: "video", label: "Video" },
            { key: "audio", label: "Audio" },
          ].map((o) => (
            <button
              key={o.key}
              type="button"
              className={`pill ${kind === o.key ? "is-active" : ""}`}
              onClick={() => {
                setKind(o.key);
                clearPicked();
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone + live preview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr 180px" : "1fr 220px",
          gap: 12,
          alignItems: "start",
          marginBottom: 8,
          minWidth: 0,
        }}
      >
        <div
          ref={dropRef}
          onClick={openPicker}
          style={{
            border: "2px dashed #e5d9ff",
            background: "#f8f5ff",
            height: 170,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            minWidth: 0,
          }}
          title="Click to choose a file"
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            hidden
            onChange={onPick}
          />
          <div style={{ color: "#7c3aed", fontWeight: 600, textAlign: "center" }}>
            Drag & drop or click to choose a file…
          </div>
        </div>

        <div
          className="dashboard-card"
          style={{ padding: 8, height: 170, borderRadius: 12, minWidth: 0 }}
        >
          {!previewUrl ? (
            <div className="muted" style={{ fontSize: 13 }}>Pick a file to preview it here.</div>
          ) : kind === "video" ? (
            <video
              src={previewUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 10,
                border: "1px solid #eee",
              }}
              controls
              muted
            />
          ) : kind === "audio" ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
              <audio src={previewUrl} controls style={{ width: "100%" }} />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 10,
                border: "1px solid #eee",
                background: `#fff url("${previewUrl}") center/contain no-repeat`,
              }}
              aria-label="Preview"
            />
          )}
        </div>
      </div>

      {/* File info & progress */}
      {fileName && (
        <div
          className="dashboard-card"
          style={{ padding: 8, display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#eee",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
            }}
            title="Selected file"
          >
            📄
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
              title={fileName}
            >
              {fileName}
            </div>
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 6, background: "#eee", borderRadius: 6 }}>
                <div
                  style={{
                    height: 6,
                    width: `${pct || 0}%`,
                    borderRadius: 6,
                    background: pct > 0 ? "#7c3aed" : "#d1fae5",
                    transition: "width 200ms linear",
                  }}
                />
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {pct > 0
                  ? `${pct}% uploading…`
                  : ready
                  ? "✅ Ready to upload"
                  : "Processing…"}
              </div>
            </div>
          </div>
          <button className="btn sm" onClick={clearPicked} disabled={busy}>Clear</button>
        </div>
      )}

      {/* Destination selectors - Category & Subfolder */}
      <div className="muted" style={{ fontSize: 12, margin: "6px 0" }}>
        Step 2 — Pick where it goes (optional)
      </div>
      <label className="input" style={{ marginBottom: 8 }}>
        <div className="input__label">Category</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="select"
            value={catId}
            onChange={(e) => {
              setCatId(e.target.value);
              setFolderId("");
            }}
            style={{ flex: 1 }}
          >
            <option value="">— none —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.title || c.id}</option>
            ))}
          </select>
          <button
            className="btn sm"
            type="button"
            onClick={async () => {
              const t = prompt("New category name?");
              if (t && addCategory) await addCategory(t.trim());
            }}
          >
            New
          </button>
        </div>
      </label>

      <label className="input" style={{ marginBottom: 8 }}>
        <div className="input__label">Subfolder</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="select"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            style={{ flex: 1 }}
            disabled={!catId}
          >
            <option value="">— none —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.title || f.id}</option>
            ))}
          </select>
          <button
            className="btn sm"
            type="button"
            disabled={!catId}
            onClick={async () => {
              const t = prompt("New subfolder name?");
              if (t && addFolder) await addFolder(catId, t.trim());
            }}
          >
            New
          </button>
        </div>
      </label>

      {/* Optional title input */}
      <div className="muted" style={{ fontSize: 12, margin: "6px 0" }}>
        Step 3 — Add a title (optional)
      </div>
      <label className="input" style={{ marginBottom: 10 }}>
        <input
          className="input__field"
          placeholder="Give it a name…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      {/* Advanced info (collapsed by default) */}
      <details style={{ marginBottom: 8 }}>
        <summary className="muted">Advanced</summary>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          • Spaces uploads are <strong>private</strong> by default.<br />
          • Background remover is <strong>off</strong> for Spaces.<br />
          • Files are stored under <code>images/users/&lt;uid&gt;/spaces/&lt;spaceId&gt;</code>.<br />
          • Video/Audio are uploaded without image processing.
        </div>
      </details>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn primary" onClick={handleUpload} disabled={!canUpload}>
          {pct > 0 ? "Uploading…" : "Upload to Space"}
        </button>
        <button className="btn" disabled>
          Use Camera
        </button>
      </div>
    </div>
  );
}
