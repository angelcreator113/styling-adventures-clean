import React, { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { fx } from "@/utils/functions";            // ← use our region-bound getter
import { auth } from "@/utils/init-firebase";      // for current user
import toast, { Toaster } from "react-hot-toast";

export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("fan");
  const [cap, setCap] = useState("");

  const notify = (type, msg) =>
    type === "error" ? toast.error(msg) : toast.success(msg);

  async function refreshMyRole() {
    try {
      const user = auth.currentUser;
      if (!user) return notify("error", "Not signed in.");
      toast.loading("Refreshing role…", { id: "refresh-role" });
      await user.getIdToken(true);              // force refresh custom claims
      toast.dismiss("refresh-role");
      notify("success", "Role refreshed!");
      // optional: ping your /whoami to warm the cookie/session
      await fetch("/whoami", { credentials: "include" }).catch(()=>{});
      // optional: soft reload so route guards re-check claims
      setTimeout(() => window.location.reload(), 300);
    } catch (e) {
      toast.dismiss("refresh-role");
      notify("error", "Couldn’t refresh role.");
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      return notify("error", "Enter a valid email address.");
    }

    const payload = { email: cleanEmail, role };
    if (role === "creator" && cap !== "") {
      const n = Number(cap);
      if (!Number.isFinite(n) || n < 0) return notify("error", "Spaces cap must be ≥ 0.");
      payload.spacesCap = n;
    }

    try {
      const call = httpsCallable(fx(), "setUserRole");
      toast.loading("Updating role…", { id: "role" });
      const res = await call(payload);
      toast.dismiss("role");

      if (res?.data?.ok) {
        notify("success",
          `Updated: ${cleanEmail} → ${role}${payload.spacesCap != null ? ` (spaces: ${payload.spacesCap})` : ""}`
        );
        setEmail(""); setCap(""); setRole("fan");
      } else {
        notify("error", "Something went wrong.");
      }
    } catch (err) {
      toast.dismiss("role");
      const msg = String(err?.message || err);
      if (msg.includes("permission-denied")) return notify("error", "Admins only.");
      if (msg.includes("not-found"))         return notify("error", "User not found.");
      if (msg.includes("invalid-argument"))  return notify("error", "Invalid inputs.");
      notify("error", "Failed to update role.");
    }
  };

  return (
    <section className="container" style={{ padding: 16 }}>
      <Toaster position="top-right" />
      <div className="dashboard-card" style={{ padding: 16, display: "grid", gap: 16 }}>
        <header>
          <h1 className="page-title" style={{ marginTop: 0 }}>Manage Users (Roles)</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Admins only. Set a user’s role and optionally a spaces cap for creators.
          </p>
        </header>

        {/* Role editor */}
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
          <div>
            <label className="input__label" htmlFor="user-email">User email</label>
            <input
              id="user-email"
              type="email"
              className="input__field"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="input__label" htmlFor="user-role">Role</label>
            <select
              id="user-role"
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="fan">Fan</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
            <div className="muted" style={{ marginTop: 6 }}>
              Admins have full access. Creators can access Creator Studio.
            </div>
          </div>

          {role === "creator" && (
            <div style={{ display: "grid", gap: 6 }}>
              <label className="input__label" htmlFor="spaces-cap">Spaces Cap (optional)</label>
              <input
                id="spaces-cap"
                type="number"
                min={0}
                className="input__field"
                placeholder="e.g. 2"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
              />
              <div className="muted">
                Stored at <code>users/&lt;uid&gt;/settings/profile.spacesCap</code>.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" type="submit">Save</button>
            <button className="btn" type="button" onClick={() => { setEmail(""); setCap(""); setRole("fan"); }}>
              Reset
            </button>
          </div>
        </form>

        {/* My role refresher */}
        <div className="hr" />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button className="btn ghost" type="button" onClick={refreshMyRole}>
            Refresh my role
          </button>
          <span className="muted">
            After you (or another admin) change your claims, click this to pull new custom claims into your session.
          </span>
        </div>
      </div>
    </section>
  );
}
