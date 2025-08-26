import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/init-firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  documentId,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

function fmtDate(s) {
  // expects YYYY-MM-DD -> Mon 8/20
  try {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return s;
  }
}

export default function AdminBoardsAnalytics() {
  const [days, setDays] = useState(14); // pull last N days
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState([]); // [{dateKey, added, removed}]
  const [catTotals, setCatTotals] = useState([]); // [{name, count}]
  const [boardTotals, setBoardTotals] = useState([]); // [{name, added, removed}]

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);

      // Query last N day docs by documentId() (YYYY-MM-DD)
      const daysCol = collection(db, "admin/metrics/boards/daily");
      const qy = query(daysCol, orderBy(documentId(), "desc"), limit(days));
      const snap = await getDocs(qy);

      const dayDocs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.id < b.id ? -1 : 1)); // oldest -> newest for charts

      // Build time-series (added/removed)
      const ts = dayDocs.map((d) => ({
        dateKey: d.id,
        added: Number(d.added || 0),
        removed: Number(d.removed || 0),
      }));

      // Aggregate categories & boards across the same window
      const catMap = new Map(); // slug/name -> count
      const boardMap = new Map(); // uid:boardId -> {name, added, removed}

      // read subcollections for each day: /categories and /boards
      for (const day of dayDocs) {
        const dayRef = doc(db, "admin/metrics/boards/daily", day.id);

        // categories
        const catsSnap = await getDocs(collection(dayRef, "categories"));
        catsSnap.forEach((c) => {
          const data = c.data() || {};
          const label = (data.label || "Uncategorized").trim();
          const prev = catMap.get(label) || 0;
          catMap.set(label, prev + Number(data.count || 0));
        });

        // boards
        const boardsSnap = await getDocs(collection(dayRef, "boards"));
        boardsSnap.forEach((b) => {
          const data = b.data() || {};
          const key = `${data.uid || "?"}:${data.boardId || "?"}`;
          const prev = boardMap.get(key) || { name: key, added: 0, removed: 0 };
          boardMap.set(key, {
            name: data.label || key,
            added: prev.added + Number(data.added || 0),
            removed: prev.removed + Number(data.removed || 0),
          });
        });
      }

      if (!ignore) {
        setSeries(ts);
        setCatTotals(
          Array.from(catMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)
        );
        setBoardTotals(
          Array.from(boardMap.values())
            .sort((a, b) => b.added - a.added)
            .slice(0, 12)
        );
        setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [days]);

  const totalAdded = useMemo(
    () => series.reduce((s, d) => s + (d.added || 0), 0),
    [series]
  );
  const totalRemoved = useMemo(
    () => series.reduce((s, d) => s + (d.removed || 0), 0),
    [series]
  );

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ padding: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Boards Analytics</h2>
            <div className="muted">Timeseries and top categories/boards</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label className="muted">Window:</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <div className="muted">Added: <strong>{totalAdded}</strong></div>
            <div className="muted">Removed: <strong>{totalRemoved}</strong></div>
          </div>
        </header>

        {/* Timeseries */}
        <div style={{ marginTop: 16, height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={series.map(d => ({ ...d, label: fmtDate(d.dateKey) }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="added" name="Added" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="removed" name="Removed" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 8px" }}>Top Categories</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={catTotals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Boards */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 8px" }}>Top Boards</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={boardTotals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="added" name="Added" />
                <Bar dataKey="removed" name="Removed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
