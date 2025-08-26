// src/pages/admin/manage/AdminUsers.jsx
import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/utils/init-firebase";
import toast, { Toaster } from "react-hot-toast";

/**
 * AdminUsers
 * Tiny role manager:
 *  - Enter target email
 *  - Choose role (fan/creator/admin)
 *  - Optional: spaces cap when role=creator
 * Security:
 *  - Only an admin can call the callable (enforced server-side)
 */
export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("fan");
  const [cap, setCap] = useState("");

  // Local helper to show toasts in your design
  const notify = (type, msg) =>
    type === "error" ? toast.error(msg) : toast.success(msg);

  const onSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      return notify("error", "Enter a valid email address.");
    }

    // Compose payload for callable; only include spacesCap if role is creator
    const data = { email: cleanEmail, role };
    if (role === "creator" && cap !== "") {
      const n = Number(cap);
      if (!Number.isFinite(n) || n < 0) {
        return notify("error", "Spaces cap must be a non-negative number.");
      }
      data.spacesCap = n;
    }

    try {
      // Ensure user is logged in (session cookie or client auth), then call function
      const functions = getFunctions();
      const setUserRole = httpsCallable(functions, "setUserRole");

      const p = setUserRole(data);
      toast.loading("Updating role…", { id: "role" });
      const res = await p;

      toast.dismiss("role");
      if (res?.data?.ok) {
        notify(
          "success",
          `Updated: ${cleanEmail} → ${role}${
            data.spacesCap != null ? ` (spaces: ${data.spacesCap})` : ""
          }`
        );
        setEmail("");
        setCap("");
        setRole("fan");
      } else {
        notify("error", "Something went wrong.");
      }
    } catch (err) {
      toast.dismiss("role");
      const code = err?.message || String(err);
      if (code.includes("unauthorized")) {
        notify("error", "You don’t have permission to do that.");
      } else if (code.includes("user-not-found")) {
        notify("error", "User not found. Create the account first.");
      } else if (code.includes("invalid-args")) {
        notify("error", "Invalid inputs.");
      } else {
        notify("error", "Failed to update role.");
      }
    }
  };

  return (
    <section className="container" style={{ padding: 16 }}>
      <Toaster position="top-right" />

      <div className="dashboard-card" style={{ padding: 16 }}>
        <h1 className="page-title" style={{ marginTop: 0 }}>
          Manage Users (Roles)
        </h1>
        <p className="muted" style={{ marginTop: 4 }}>
          Admins only. Set a user’s role and optionally a spaces cap for creators.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12, maxWidth: 560 }}>
          {/* Email */}
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

          {/* Role */}
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

          {/* Spaces cap (only shown for creators) */}
          {role === "creator" && (
            <div style={{ display: "grid", gap: 6 }}>
              <label className="input__label" htmlFor="spaces-cap">
                Spaces Cap (optional)
              </label>
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
                Leave blank for default. This number is stored at
                <code> users/&lt;uid&gt;/settings/profile.spacesCap</code>.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" type="submit">Save</button>
            <button
              className="btn"
              type="button"
              onClick={() => { setEmail(""); setCap(""); setRole("fan"); }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
