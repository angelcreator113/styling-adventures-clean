// src/pages/LoginPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/utils/init-firebase";

export default function LoginPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => setErr(""), [email, password]);

  // Ensure local persistence once
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((e) =>
      console.warn("[auth] setPersistence failed", e)
    );
  }, []);

  // Handle redirect result if we came back from Google
  useEffect(() => {
    (async () => {
      try {
        const res = await getRedirectResult(auth);
        if (res?.user) {
          nav("/home", { replace: true });
        }
      } catch (e) {
        console.warn("[auth] getRedirectResult error", e);
      }
    })();
  }, [nav]);

  // If already authed, go home
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      if (u) nav("/home", { replace: true });
    });
    return off;
  }, [nav]);

  async function googleSignIn() {
    setErr("");
    setBusy(true);

    // Helper: treat any “popup-ish” or transient errors as a signal to redirect
    const shouldFallbackToRedirect = (code = "") => {
      const c = String(code || "");
      return [
        "auth/popup-blocked",
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
        "auth/network-request-failed",
        "auth/internal-error",
      ].some((k) => c.includes(k));
    };

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will navigate
    } catch (e) {
      console.warn("[auth] popup failed", e?.code, e?.message);
      if (shouldFallbackToRedirect(e?.code)) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          await signInWithRedirect(auth, provider);
          return; // browser navigates away
        } catch (e2) {
          console.warn("[auth] redirect failed", e2?.code, e2?.message);
          setErr("Google sign-in failed. Please reload and try again.");
        }
      } else {
        // Unknown error: still try redirect as a last resort
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          await signInWithRedirect(auth, provider);
          return;
        } catch {
          setErr(e?.message || "Google sign-in failed.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function emailLogin(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged will navigate
    } catch (e) {
      const msg =
        e?.code === "auth/invalid-credential" ? "Invalid email or password"
        : e?.code === "auth/too-many-requests" ? "Too many attempts. Try again later."
        : e?.message || "Login failed.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function emailSignup() {
    setErr("");
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged will navigate
    } catch (e) {
      const msg =
        e?.code === "auth/weak-password" ? "Please choose a stronger password."
        : e?.code === "auth/email-already-in-use" ? "Email already in use."
        : e?.message || "Signup failed.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap" style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back ✨</h2>

        <button onClick={googleSignIn} style={styles.googleBtn} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.7 3l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.4 0 19-7.5 19-20 0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16.2 18.8 12 24 12c3 0 5.7 1.1 7.7 3l5.7-5.7C33.6 6.1 29 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.3l-6.1-5c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.7-11.3-8.7l-6.5 5C9.2 39.5 16.1 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.9-5.1 8-11.3 8-5.3 0-9.7-3.7-11.3-8.7l-6.5 5C9.2 39.5 16.1 44 24 44c10.4 0 19-7.5 19-20 0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          {busy ? "Working…" : "Continue with Google"}
        </button>

        <div style={styles.divider}><span>or</span></div>

        <form onSubmit={emailLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            disabled={busy}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={busy}
          />
          <button type="submit" style={styles.primaryBtn} disabled={busy}>
            {busy ? "Working…" : "Login"}
          </button>
        </form>

        <button onClick={emailSignup} style={styles.linkBtn} disabled={busy}>
          Don’t have an account? Sign up
        </button>

        {!!err && <div style={styles.err} role="alert">{err}</div>}
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "grid", placeItems: "center" },
  card: { width: 420, padding: 24, borderRadius: 16, background: "#1f1b24", color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,.35)" },
  title: { margin: "0 0 16px" },
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #3a3442", background: "#2b2630", color: "#fff", marginBottom: 10 },
  primaryBtn: { width: "100%", padding: "12px 14px", borderRadius: 10, border: 0, background: "#a855f7", color: "#fff", fontWeight: 600, marginTop: 4, cursor: "pointer" },
  googleBtn: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #3a3442", background: "#2b2630", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" },
  divider: { display: "grid", placeItems: "center", margin: "14px 0", color: "#bfb6c9" },
  linkBtn: { marginTop: 8, color: "#c4b5fd", background: "transparent", border: 0, cursor: "pointer" },
  err: { marginTop: 10, color: "#ff9aa2", fontSize: 14 },
};
