// src/pages/creator/spaces/CreatorSpacesIndex.jsx
import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useUserRole } from "@/hooks/useUserRole";
import { getSpaceLimitsAndUsage } from "@/utils/spaceLimits";
import { notify } from "@/utils/notify"; // ← toast helpers
import SpaceCard from "./SpaceCard.jsx";

function Banner({ cap, count }) {
  const unlimited = cap === Infinity || cap === 0;
  const leftText = unlimited ? "Unlimited spaces" : `${Math.max(0, cap - count)} left`;
  const capped = !unlimited && count >= cap;
  return (
    <div className="muted" style={{ marginTop: 8 }}>
      {capped ? (
        <>You’ve created {count} Spaces — upgrade or ask an admin to unlock more.</>
      ) : (
        leftText
      )}
    </div>
  );
}

function Tips() {
  return (
    <div className="dashboard-card" style={{ padding: 16, marginTop: 12 }}>
      <h3 style={{ margin: 0 }}>What are Spaces?</h3>
      <p style={{ margin: "6px 0 10px" }}>
        Spaces are your personal content buckets. Use them to separate campaigns, themes, or
        projects so uploads stay organized and stress‑free.
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>✨ Stay organized — no more mixing projects</li>
        <li>📂 Included on your plan (ask admin to raise your limit)</li>
        <li>🖼️ Visual dashboard with thumbnails</li>
        <li>🚀 Grow later — unlock more spaces</li>
      </ul>
    </div>
  );
}

export default function CreatorSpacesIndex() {
  const uid = auth.currentUser?.uid || null;
  const { effectiveRole } = useUserRole();

  const [spaces, setSpaces] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [capMax, setCapMax] = useState(Infinity);
  const [limitsLoading, setLimitsLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    async function load() {
      if (!uid) return;
      setLimitsLoading(true);
      try {
        const { max } = await getSpaceLimitsAndUsage(uid);
        const normalized = Number(max) === 0 ? Infinity : Number(max);
        if (!stop) setCapMax(Number.isFinite(normalized) ? normalized : Infinity);
      } catch {
        if (!stop) setCapMax(Infinity);
      } finally {
        if (!stop) setLimitsLoading(false);
      }
    }
    load();
    return () => { stop = true; };
  }, [uid]);

  useEffect(() => {
    if (!uid) return undefined;
    const qq = query(collection(db, `users/${uid}/spaces`), orderBy("createdAt", "asc"));
    return onSnapshot(qq, (snap) => {
      setSpaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  const isAtCap =
    !limitsLoading && Number.isFinite(capMax) && capMax !== 0 && spaces.length >= capMax;

  async function createSpace() {
    if (!uid) return;

    const { ok, current, max } = await getSpaceLimitsAndUsage(uid);
    const limited = (max ?? 0) !== 0; // max=0 → unlimited
    if (!ok && limited) {
      notify.error(
        `Space limit reached (${current}/${max}). Ask an admin to increase your limit.`
      );
      return;
    }

    const name = prompt("Name your Space:");
    if (!name) return;

    const p = addDoc(collection(db, `users/${uid}/spaces`), {
      uid,
      name: name.trim(),
      status: "active",
      itemCount: 0,
      lastPreviewUrl: null,
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
    });

    await notify.promise(
      p,
      {
        loading: "Creating your Space…",
        success: "Space created 🎉",
        error: "Couldn’t create the Space. Try again.",
      }
    );

    // Refresh cap snapshot just in case
    try {
      const { max: nextMax } = await getSpaceLimitsAndUsage(uid);
      setCapMax(Number(nextMax) === 0 ? Infinity : Number(nextMax));
    } catch { /* ignore */ }
  }

  const shown = useMemo(
    () =>
      spaces.filter((s) =>
        statusFilter === "all" ? true : (s.status || "active") === statusFilter
      ),
    [spaces, statusFilter]
  );

  return (
    <section className="container" style={{ padding: 16 }}>
      <div
        className="row"
        style={{ alignItems: "center", justifyContent: "space-between", gap: 10 }}
      >
        <h1 style={{ margin: 0 }}>Spaces</h1>
        <div className="row" style={{ gap: 10 }}>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>

          <button
            className="btn primary"
            onClick={createSpace}
            disabled={isAtCap}
            title={isAtCap ? "You’ve reached your spaces limit" : "Create a new space"}
          >
            + New Space
          </button>
        </div>
      </div>

      <Banner cap={Number(capMax) === 0 ? Infinity : capMax} count={spaces.length} />
      <Tips />

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          marginTop: 16,
        }}
      >
        {shown.map((s) => (
          <SpaceCard key={s.id} uid={uid} space={{ id: s.id, ...s }} />
        ))}
        {!shown.length && (
          <div className="dashboard-card" style={{ padding: 16 }}>
            No {statusFilter} spaces.{" "}
            {statusFilter !== "all"
              ? "Try changing the filter."
              : "Click + New Space to get started."}
          </div>
        )}
      </div>
    </section>
  );
}
