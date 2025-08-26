// src/pages/Sidebar/PlannerPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import {
  addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc
} from "firebase/firestore";

function icsEscape(s=""){ return s.replace(/([,;])/g,"\\$1").replace(/\n/g,"\\n"); }
function makeICS({ title, notes, eventDate, status }) {
  const dt = new Date(eventDate);
  const pad = (n) => String(n).padStart(2,"0");
  const y = dt.getUTCFullYear(), m = pad(dt.getUTCMonth()+1), d = pad(dt.getUTCDate());
  const date = `${y}${m}${d}T090000Z`; // 9am UTC
  const uid = `${Date.now()}@digital-closet`;
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Digital Closet//Planner//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${date}`,
    `DTSTART:${date}`,
    `SUMMARY:${icsEscape(title || "Outfit Event")}`,
    notes ? `DESCRIPTION:${icsEscape(notes)}` : "",
    status ? `STATUS:${status === "ready" ? "CONFIRMED" : "TENTATIVE"}` : "",
    "END:VEVENT","END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}

export default function PlannerPage() {
  const uid = auth.currentUser?.uid;
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ title:"", eventDate:"", vibe:"", notes:"", status:"shopping", remindDays:3 });

  useEffect(() => {
    if (!uid) return;
    const col = collection(db, `users/${uid}/planner_events`);
    const q = query(col, orderBy("eventDate", "desc"));
    const off = onSnapshot(q, (snap) => setRows(snap.docs.map(d=>({id:d.id, ...d.data()}))));
    return () => off();
  }, [uid]);

  async function addEvent(e){
    e.preventDefault();
    if (!f.title || !f.eventDate) return;
    await addDoc(collection(db, `users/${uid}/planner_events`), {
      ...f, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    setF({ title:"", eventDate:"", vibe:"", notes:"", status:"shopping", remindDays:3 });
  }
  const setStatus = (row, status) => updateDoc(doc(db, `users/${uid}/planner_events/${row.id}`), { status, updatedAt: serverTimestamp()});
  const remove     = (row) => deleteDoc(doc(db, `users/${uid}/planner_events/${row.id}`));
  const downloadIcs = (row) => {
    const ics = makeICS(row);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${row.title || "outfit-event"}.ics`; a.click();
    URL.revokeObjectURL(url);
  };

  const upcoming = useMemo(() => [...rows].sort((a,b)=> (a.eventDate||"") < (b.eventDate||"") ? 1 : -1), [rows]);

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Event Outfit Planner</h1>

        <form onSubmit={addEvent} className="grid" style={{ gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))" }}>
          <input  placeholder="Event title" value={f.title} onChange={e=>setF({...f, title:e.target.value})} required />
          <input  type="date" value={f.eventDate} onChange={e=>setF({...f, eventDate:e.target.value})} required />
          <input  placeholder="Vibe (e.g., chic, street…)" value={f.vibe} onChange={e=>setF({...f, vibe:e.target.value})}/>
          <select value={f.status} onChange={e=>setF({...f, status:e.target.value})}>
            <option value="shopping">🛍 still shopping</option>
            <option value="ready">✅ outfit ready</option>
          </select>
          <input  type="number" min="0" placeholder="Remind (days before)" value={f.remindDays} onChange={e=>setF({...f, remindDays:Number(e.target.value||0)})}/>
          <input  placeholder="Notes (optional)" value={f.notes} onChange={e=>setF({...f, notes:e.target.value})}/>
          <button className="btn primary" type="submit">Save Event</button>
        </form>

        <h2 style={{ marginTop: 16 }}>My Events</h2>
        <div className="cards" style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))" }}>
          {upcoming.map(row => (
            <article key={row.id} className="dashboard-card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{row.title}</div>
              <div className="muted">{row.eventDate}</div>
              <div style={{ marginTop: 4 }}>
                {row.vibe ? <span className="chip">Vibe: {row.vibe}</span> : null}{" "}
                <span className="chip">{row.status === "ready" ? "✅ Ready" : "🛍 Shopping"}</span>{" "}
                {Number.isFinite(row.remindDays) ? <span className="chip">{row.remindDays}d reminder</span> : null}
              </div>
              {row.notes ? <p style={{ marginTop: 6 }}>{row.notes}</p> : null}

              <div className="row" style={{ display:"flex", gap:6, marginTop:6 }}>
                <button className="btn sm" onClick={()=>downloadIcs(row)}>Add to Calendar (.ics)</button>
                {row.status !== "ready" ? (
                  <button className="btn sm" onClick={()=>setStatus(row, "ready")}>Mark Ready</button>
                ) : (
                  <button className="btn sm" onClick={()=>setStatus(row, "shopping")}>Mark Shopping</button>
                )}
                <button className="btn sm danger" onClick={()=>remove(row)}>Delete</button>
              </div>
            </article>
          ))}
          {upcoming.length === 0 && <p className="muted">No events yet — add your first!</p>}
        </div>
      </div>
    </section>
  );
}
