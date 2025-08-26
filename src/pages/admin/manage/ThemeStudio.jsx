import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/utils/init-firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";

function toSlug(s = "") {
  return String(s).toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

const DEFAULTS = {
  label: "",
  type: "gradient",          // 'solid' | 'gradient' | 'paper'
  colors: ["#f5ecff", "#efe9ff"], // for gradient/solid
  angle: 90,                 // degrees (for gradient)
  radius: 16,                // px corner radius of stage
  shadow: 1,                 // 0 off / 1 on (drop shadow under cutout)
  marginPct: 10,             // % whitespace margin around cutout
  biasY: 0,                  // -50..50 shift cutout vertically (% of stage height)
  note: "",
};

export default function ThemeStudio() {
  const [themes, setThemes] = useState([]);
  const [editing, setEditing] = useState(null);     // doc object being edited
  const [form, setForm] = useState(DEFAULTS);
  const canvasRef = useRef(null);

  // live list
  useEffect(() => {
    const qy = query(collection(db, "themes"), orderBy("updatedAt", "desc"));
    const off = onSnapshot(qy, (snap) => {
      setThemes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => off();
  }, []);

  // parse & normalize form values
  const parsed = useMemo(() => {
    const f = { ...form };
    f.angle = Number.isFinite(+f.angle) ? +f.angle : DEFAULTS.angle;
    f.radius = Math.max(0, +f.radius || 0);
    f.shadow = +f.shadow ? 1 : 0;
    f.marginPct = Math.min(30, Math.max(0, +f.marginPct || 0));
    f.biasY = Math.min(50, Math.max(-50, +f.biasY || 0));
    f.colors = Array.isArray(f.colors)
      ? f.colors
      : String(f.colors || "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);
    if (f.type === "solid" && f.colors.length) f.colors = [f.colors[0]];
    return f;
  }, [form]);

  // draw preview
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    const W = 480; // 3:4 preview
    const H = 640;
    el.width = W;
    el.height = H;

    // rounded-rect clip
    const r = parsed.radius;
    ctx.save();
    ctx.beginPath();
    roundedRectPath(ctx, 0, 0, W, H, r);
    ctx.clip();

    // background fill
    if (parsed.type === "solid") {
      ctx.fillStyle = parsed.colors[0] || "#f6f6fb";
      ctx.fillRect(0, 0, W, H);
    } else if (parsed.type === "gradient") {
      const g = gradientByAngle(ctx, W, H, parsed.angle);
      const cols = parsed.colors.length ? parsed.colors : ["#fafafa", "#efefff"];
      const stops = cols.length - 1;
      cols.forEach((c, i) => g.addColorStop(stops ? i / stops : 0, c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else if (parsed.type === "paper") {
      // simple light paper look
      ctx.fillStyle = parsed.colors[0] || "#ffffff";
      ctx.fillRect(0, 0, W, H);
      // noise overlay
      noise(ctx, W, H, 0.06);
      // very subtle vignette
      vignette(ctx, W, H, 0.06);
    }

    // "drop shadow" under the cutout
    if (parsed.shadow) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.18)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      // invisible rect just to project shadow
      const inset = Math.round((parsed.marginPct / 100) * Math.min(W, H));
      const x = inset;
      const y = inset + (parsed.biasY / 100) * H;
      const w = W - inset * 2;
      const h = H - inset * 2;
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }

    // sample cutout (just draw a centered silhouette so you can judge layout)
    drawSampleGarment(ctx, W, H, parsed);

    ctx.restore();
    // border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    roundedRectPath(ctx, 0.5, 0.5, W-1, H-1, parsed.radius);
    ctx.stroke();
  }, [parsed]);

  function selectTheme(t) {
    setEditing(t);
    setForm({
      label: t.label || "",
      type: t.type || DEFAULTS.type,
      colors: Array.isArray(t.colors) ? t.colors : (t.colors ? [t.colors] : []),
      angle: t.angle ?? DEFAULTS.angle,
      radius: t.radius ?? DEFAULTS.radius,
      shadow: t.shadow ? 1 : 0,
      marginPct: t.marginPct ?? DEFAULTS.marginPct,
      biasY: t.biasY ?? DEFAULTS.biasY,
      note: t.note || "",
    });
  }

  async function saveTheme() {
    const payload = {
      ...parsed,
      updatedAt: serverTimestamp(),
    };
    if (editing?.id) {
      await setDoc(doc(db, "themes", editing.id), { ...payload, label: parsed.label }, { merge: true });
    } else {
      await addDoc(collection(db, "themes"), {
        ...payload,
        label: parsed.label,
        createdAt: serverTimestamp(),
      });
    }
    // keep in edit mode but ensure we have latest
  }

  async function newTheme() {
    setEditing(null);
    setForm(DEFAULTS);
  }

  async function removeTheme(id) {
    if (!id) return;
    if (!window.confirm("Delete this theme?")) return;
    await deleteDoc(doc(db, "themes", id));
    if (editing?.id === id) newTheme();
  }

  return (
    <div className="page admin-theme-studio">
      <div className="header">
        <h1>Theme Studio</h1>
        <p className="muted">Manage background styles for closet previews. Publicly readable; admin write.</p>
      </div>

      <div className="grid">
        {/* left: list */}
        <section className="card">
          <div className="card__body">
            <div className="toolbar">
              <button className="btn" onClick={newTheme}>+ New Theme</button>
            </div>
            <ul className="theme-list">
              {themes.map(t => (
                <li key={t.id} className={`theme-row ${editing?.id === t.id ? "is-active" : ""}`}>
                  <button className="row-main" onClick={() => selectTheme(t)}>
                    <span className="chip">{t.type}</span>
                    <span className="label">{t.label || t.id}</span>
                    <span className="swatches">
                      {(t.colors || []).slice(0, 4).map((c,i) => (
                        <i key={i} style={{background:c}} />
                      ))}
                    </span>
                  </button>
                  <button className="row-del" onClick={() => removeTheme(t.id)} title="Delete">✕</button>
                </li>
              ))}
              {!themes.length && <li className="muted">No themes yet.</li>}
            </ul>
          </div>
        </section>

        {/* right: editor + preview */}
        <section className="card">
          <div className="card__body">
            <h3>{editing ? "Edit Theme" : "Create Theme"}</h3>

            <div className="form grid-2">
              <label>
                <span>Label</span>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({...f, label:e.target.value}))}
                  placeholder="Lavender Glow"
                />
              </label>

              <label>
                <span>Type</span>
                <select value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))}>
                  <option value="solid">Solid</option>
                  <option value="gradient">Gradient</option>
                  <option value="paper">Paper</option>
                </select>
              </label>

              <label>
                <span>Colors (comma-separated)</span>
                <input
                  value={Array.isArray(form.colors) ? form.colors.join(", ") : (form.colors || "")}
                  onChange={e => setForm(f => ({...f, colors:e.target.value}))}
                  placeholder="#f5ecff, #efe9ff"
                />
              </label>

              <label>
                <span>Angle (deg, for gradient)</span>
                <input
                  type="number"
                  value={form.angle}
                  onChange={e => setForm(f => ({...f, angle:e.target.value}))}
                />
              </label>

              <label>
                <span>Radius (px)</span>
                <input
                  type="number"
                  value={form.radius}
                  onChange={e => setForm(f => ({...f, radius:e.target.value}))}
                />
              </label>

              <label>
                <span>Margin (%)</span>
                <input
                  type="number"
                  value={form.marginPct}
                  onChange={e => setForm(f => ({...f, marginPct:e.target.value}))}
                />
              </label>

              <label>
                <span>Bias Y (%)</span>
                <input
                  type="number"
                  value={form.biasY}
                  onChange={e => setForm(f => ({...f, biasY:e.target.value}))}
                />
              </label>

              <label className="inline">
                <input
                  type="checkbox"
                  checked={!!form.shadow}
                  onChange={e => setForm(f => ({...f, shadow: e.target.checked ? 1 : 0}))}
                />
                <span>Drop shadow</span>
              </label>

              <label className="span-2">
                <span>Note</span>
                <input
                  value={form.note || ""}
                  onChange={e => setForm(f => ({...f, note: e.target.value}))}
                  placeholder="Optional description"
                />
              </label>
            </div>

            <div className="actions">
              <button className="btn primary" onClick={saveTheme}>
                {editing ? "Save Changes" : "Create Theme"}
              </button>
            </div>

            <div className="preview">
              <canvas ref={canvasRef} width={480} height={640} />
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .admin-theme-studio .grid { display:grid; grid-template-columns: 320px 1fr; gap:16px; }
        .admin-theme-studio .toolbar { display:flex; justify-content:flex-end; margin-bottom:.5rem; }
        .theme-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
        .theme-row { display:flex; align-items:center; gap:8px; }
        .theme-row .row-main { flex:1; display:flex; align-items:center; gap:8px; padding:.5rem .6rem; border:1px solid #e5e7eb; border-radius:10px; background:#fff; cursor:pointer; }
        .theme-row.is-active .row-main { border-color:#c7d2fe; box-shadow:0 0 0 2px rgba(99,102,241,.15) inset; }
        .theme-row .row-del { border:none; background:#fff0f0; color:#b91c1c; border:1px solid #fecaca; border-radius:8px; padding:.2rem .5rem; }
        .chip { font-size:12px; padding:2px 8px; border-radius:999px; background:#f3f4f6; border:1px solid #e5e7eb; }
        .label { font-weight:600; }
        .swatches { display:flex; gap:4px; margin-left:auto; }
        .swatches i { width:16px; height:16px; border-radius:4px; border:1px solid #e5e7eb; display:inline-block; }
        .form.grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:.5rem; }
        .form label { display:flex; flex-direction:column; gap:6px; font-size:.9rem; }
        .form label.inline { flex-direction:row; align-items:center; gap:8px; }
        .form label span { color:#374151; }
        .form label input, .form label select { padding:.45rem .6rem; border:1px solid #e5e7eb; border-radius:8px; }
        .form .span-2 { grid-column: 1 / span 2; }
        .actions { margin:.8rem 0; }
        .btn { padding:.45rem .7rem; border:1px solid #e5e7eb; border-radius:8px; background:#fff; }
        .btn.primary { background:#6366f1; border-color:#6366f1; color:#fff; }
        .preview { margin-top:.5rem; display:flex; justify-content:center; }
        .card { background:#fff; border:1px solid #eee; border-radius:14px; }
        .card__body { padding:1rem; }
        .muted { color:#6b7280; }
      `}</style>
    </div>
  );
}

/* -------------- drawing helpers -------------- */

function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function gradientByAngle(ctx, W, H, angleDeg) {
  const a = (angleDeg % 360) * Math.PI / 180;
  const cx = W/2, cy = H/2;
  const rx = Math.cos(a), ry = Math.sin(a);
  const half = Math.max(W, H);
  return ctx.createLinearGradient(cx - rx*half, cy - ry*half, cx + rx*half, cy + ry*half);
}

function noise(ctx, W, H, strength = 0.05) {
  const img = ctx.getImageData(0,0,W,H);
  const d = img.data;
  for (let i=0; i<d.length; i+=4) {
    const n = (Math.random()*2-1) * 255 * strength;
    d[i]   = clamp(d[i]   + n);
    d[i+1] = clamp(d[i+1] + n);
    d[i+2] = clamp(d[i+2] + n);
  }
  ctx.putImageData(img,0,0);
}
function vignette(ctx, W, H, strength=0.08) {
  const grd = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)/3, W/2, H/2, Math.max(W,H)/1.0);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,W,H);
}
function clamp(v){ return Math.max(0, Math.min(255, v)); }

function drawSampleGarment(ctx, W, H, parsed) {
  // draw a neutral “cutout” silhouette centered with margin/bias
  const inset = Math.round((parsed.marginPct/100)*Math.min(W,H));
  const x = inset;
  const y = inset + (parsed.biasY/100)*H;
  const w = W - inset*2;
  const h = H - inset*2;

  // simulate a bag/dress shape using a rounded rect + circle
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,.06)";
  ctx.lineWidth = 2;

  // body
  roundedRectPath(ctx, x, y + h*0.12, w, h*0.80, Math.min(24, w*0.08));
  ctx.fill();
  ctx.stroke();

  // “handle”
  ctx.beginPath();
  ctx.ellipse(x + w*0.25, y + h*0.14, w*0.14, h*0.10, 0, 0, Math.PI*2);
  ctx.ellipse(x + w*0.75, y + h*0.14, w*0.14, h*0.10, 0, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
