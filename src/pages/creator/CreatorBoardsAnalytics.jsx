import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import {
  collection, doc, getDocs, limit, orderBy, query, documentId
} from "firebase/firestore";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

function fmtDate(s) {
  try {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return s; }
}
function dayOfWeekFromDateKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0..6
}

export default function CreatorBoardsAnalytics() {
  const uid = auth.currentUser?.uid;
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  const [series, setSeries] = useState([]);       // timeseries
  const [topBoards, setTopBoards] = useState([]); // [{name, saves, clicks}]
  const [topCats, setTopCats] = useState([]);     // [{name, count}]
  const [topLinks, setTopLinks] = useState([]);   // [{host, clicks}]

  // heatmap: 7(days) x 24(hours) of engagement (saves+clicks)
  const [heat, setHeat] = useState(Array.from({ length: 7 }, () => Array(24).fill(0)));

  useEffect(() => {
    if (!uid) return;
    let ignore = false;
    (async () => {
      setLoading(true);

      const base = `users/${uid}/metrics/boards/daily`;
      const qy = query(collection(db, base), orderBy(documentId(), "desc"), limit(days));
      const snap = await getDocs(qy);
      const dayDocs = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
                               .sort((a, b) => a.id.localeCompare(b.id));

      // 1) timeseries
      const ts = dayDocs.map(d => ({
        dateKey: d.id,
        label: fmtDate(d.id),
        views: Number(d.views || 0),
        saves: Number(d.saves || 0),
        clicks: Number(d.clicks || 0),
        shares: Number(d.shares || 0)
      }));

      // 2) aggregates we’ll fill by reading subcollections
      const catMap = new Map();
      const boardMap = new Map();
      const linkMap = new Map(); // host -> clicks
      const heatTmp = Array.from({ length: 7 }, () => Array(24).fill(0));

      for (const day of dayDocs) {
        const dow = dayOfWeekFromDateKey(day.id);

        // categories
        const catsSnap = await getDocs(collection(day.ref, "categories"));
        catsSnap.forEach(c => {
          const { label = "Uncategorized", count = 0 } = c.data() || {};
          catMap.set(label, (catMap.get(label) || 0) + Number(count || 0));
        });

        // boards
        const boardsSnap = await getDocs(collection(day.ref, "boards"));
        boardsSnap.forEach(b => {
          const { boardId, label, saves = 0, clicks = 0 } = b.data() || {};
          const key = boardId || b.id;
          const prev = boardMap.get(key) || { name: label || key, saves: 0, clicks: 0 };
          prev.saves += Number(saves || 0);
          prev.clicks += Number(clicks || 0);
          boardMap.set(key, prev);
        });

        // hours (heatmap) — value = saves + clicks as engagement
        const hoursSnap = await getDocs(collection(day.ref, "hours"));
        hoursSnap.forEach(h => {
          const hr = Math.max(0, Math.min(23, Number(h.id)));
          const data = h.data() || {};
          const val = Number(data.saves || 0) + Number(data.clicks || 0);
          heatTmp[dow][hr] += val;
        });

        // links (top outbound)
        const linksSnap = await getDocs(collection(day.ref, "links"));
        linksSnap.forEach(l => {
          const { host, clicks = 0 } = l.data() || {};
          if (!host) return;
          linkMap.set(host, (linkMap.get(host) || 0) + Number(clicks || 0));
        });
      }

      if (!ignore) {
        setSeries(ts);
        setTopCats(Array.from(catMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count).slice(0, 12));
        setTopBoards(Array.from(boardMap.values())
          .sort((a, b) => (b.saves + b.clicks) - (a.saves + a.clicks))
          .slice(0, 12));
        setTopLinks(Array.from(linkMap.entries())
          .map(([host, clicks]) => ({ host, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 12));
        setHeat(heatTmp);
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [uid, days]);

  const totals = useMemo(() => ({
    views: series.reduce((s, d) => s + (d.views || 0), 0),
    saves: series.reduce((s, d) => s + (d.saves || 0), 0),
    clicks: series.reduce((s, d) => s + (d.clicks || 0), 0),
    shares: series.reduce((s, d) => s + (d.shares || 0), 0)
  }), [series]);

  const engagement = useMemo(() => {
    const v = totals.views || 1;
    return (((totals.saves + totals.clicks) / v) * 100).toFixed(1);
  }, [totals]);

  const heatMax = useMemo(() => heat.flat().reduce((m, v) => Math.max(m, v), 0) || 1, [heat]);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ padding: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Creator Insights</h2>
            <div className="muted">Your boards performance (last {days} days)</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <div className="muted">Views: <strong>{totals.views}</strong></div>
            <div className="muted">Saves: <strong>{totals.saves}</strong></div>
            <div className="muted">Clicks: <strong>{totals.clicks}</strong></div>
            <div className="muted">ER: <strong>{engagement}%</strong></div>
          </div>
        </header>

        {/* Timeseries */}
        <div style={{ marginTop: 16, height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views"  name="Views"  stroke="#64748b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="saves"  name="Saves"  stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="shares" name="Shares" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 8px" }}>Best Times to Post (UTC)</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px repeat(24, 1fr)",
              gap: 2,
              alignItems: "center"
            }}
          >
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} style={{ textAlign: "center", fontSize: 11, color: "#6b7280" }}>{h}</div>
            ))}
            {heat.map((row, d) => (
              <React.Fragment key={d}>
                <div style={{ fontSize: 12, color: "#374151" }}>{dayLabels[d]}</div>
                {row.map((v, h) => {
                  const alpha = Math.min(1, v / heatMax || 0);
                  const bg = `rgba(168, 85, 247, ${alpha || 0})`;
                  return (
                    <div
                      key={`${d}-${h}`}
                      title={`${dayLabels[d]} ${h}:00 — ${v} engagements`}
                      style={{
                        height: 20,
                        borderRadius: 4,
                        background: alpha ? bg : "rgba(0,0,0,0.05)"
                      }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Engagement = saves + clicks, aggregated over the window (UTC).
          </div>
        </div>

        {/* Top Categories */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 8px" }}>Top Categories</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topCats}>
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
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topBoards}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="saves"  name="Saves" />
                <Bar dataKey="clicks" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top outbound links */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 8px" }}>Top Outbound Links</h3>
          <div className="table-wrap" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Host</th>
                  <th style={{ textAlign: "right" }}>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {topLinks.length ? topLinks.map((r) => (
                  <tr key={r.host}>
                    <td>{r.host}</td>
                    <td style={{ textAlign: "right" }}>{r.clicks}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="muted">No outbound clicks yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
