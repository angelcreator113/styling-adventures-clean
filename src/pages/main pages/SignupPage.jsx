// src/pages/SignupPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { auth, db } from "@/utils/init-firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc, setDoc, serverTimestamp,
} from "firebase/firestore";

import RoleSelectCard from "@/components/auth/RoleSelectCard.jsx";
import { beginCreatorCheckout } from "@/utils/billing.js";

/**
 * Signup flow:
 * - User picks "Fan" (free) or "Creator (paid)".
 * - If Fan:
 *    - create auth user
 *    - write users/{uid}/settings/profile (roleChoice:"fan", fanEnabled:true)
 *    - write users/{uid}/settings/limits   (spaceCap:0 for fans)
 *    - email verify (optional)
 *    - POST /sessionLogin and redirect to /home
 * - If Creator:
 *    - create auth user
 *    - write roleChoice:"creator" and mark checkoutRequired:true
 *    - redirect into payment (beginCreatorCheckout). After success,
 *      a Cloud Function (or the client) should set custom claim role=creator,
 *      and unlock 2 Spaces (limits.spaceCap = 2 as your “gift”).
 */
export default function SignupPage() {
  const nav = useNavigate();

  const [role, setRole] = useState/** @type {'fan'|'creator'|''} */('');
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  const roleLabel = useMemo(
    () => (role === "creator" ? "Creator (paid)" : role === "fan" ? "Fan (free)" : "—"),
    [role]
  );

  async function sessionLogin(idToken, remember = true) {
    await fetch("/sessionLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken, remember }),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!role) return toast.error("Pick Fan or Creator to continue.");
    if (!email || !pw) return toast.error("Enter email and password.");

    setPending(true);
    const t = toast.loading("Creating your account…");

    try {
      // 1) Create auth user
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      const { user } = cred;

      // Optional profile displayName
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }

      // 2) Persist initial settings
      const profileRef = doc(db, `users/${user.uid}/settings/profile`);
      const limitsRef  = doc(db, `users/${user.uid}/settings/limits`);
      const now = serverTimestamp();

      if (role === "fan") {
        await Promise.all([
          setDoc(profileRef, {
            uid: user.uid,
            roleChoice: "fan",
            fanEnabled: true,
            createdAt: now,
            updatedAt: now,
          }, { merge: true }),
          setDoc(limitsRef, {
            uid: user.uid,
            spaceCap: 0,           // fans: 0 spaces (upsell target)
            createdAt: now,
            updatedAt: now,
          }, { merge: true }),
        ]);

        // 3) Email verification (optional)
        try { await sendEmailVerification(user); } catch {}

        // 4) start server session (cookie)
        const idToken = await user.getIdToken();
        await sessionLogin(idToken, true);

        toast.success("Welcome! You’re all set as a fan.");
        toast.dismiss(t);
        nav("/home", { replace: true });
        return;
      }

      // role === "creator" (paid)
      await Promise.all([
        setDoc(profileRef, {
          uid: user.uid,
          roleChoice: "creator",
          fanEnabled: true,            // can still use fan features
          checkoutRequired: true,      // gate pro features behind payment
          createdAt: now,
          updatedAt: now,
        }, { merge: true }),
        setDoc(limitsRef, {
          uid: user.uid,
          // NOTE: unlock to 2 after successful payment:
          spaceCap: 0,
          createdAt: now,
          updatedAt: now,
        }, { merge: true }),
      ]);

      const idToken = await user.getIdToken();
      await sessionLogin(idToken, true);

      // 5) Kick off paid flow.
      toast.success("Let’s finish your Creator setup.");
      toast.dismiss(t);
      await beginCreatorCheckout({ uid: user.uid, email: user.email || "" });
      // Your billing page should return to app and (after webhook/Cloud Function)
      // custom-claim the user as { role:"creator" } and set limits.spaceCap = 2.
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error(err?.message || "Signup failed. Please try again.");
      setPending(false);
    }
  }

  return (
    <section className="container" style={{ padding: 16, maxWidth: 880 }}>
      <div className="dashboard-card" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Create your account</h1>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <RoleSelectCard
            role="fan"
            title="Join Free as a Fan"
            desc="Save looks, chat in Bestie Lounge, follow creators."
            price="Free"
            selected={role === "fan"}
            onSelect={() => setRole("fan")}
            perks={["Closet & Boards", "Bestie Lounge", "Upgrade any time"]}
          />
          <RoleSelectCard
            role="creator"
            title="Join as a Creator"
            desc="Publish content, organize Spaces, view insights."
            price="$X / month"
            selected={role === "creator"}
            onSelect={() => setRole("creator")}
            highlight
            perks={["Creator Studio", "2 free Spaces after upgrade", "Insights & growth"]}
          />
        </div>

        <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 20, gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <input
              className="input"
              type="text"
              placeholder="Full name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
            <input
              className="input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div className="muted">Selected: <strong>{roleLabel}</strong></div>
            <button className="btn primary" type="submit" disabled={pending || !role}>
              {pending ? "Please wait…" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
