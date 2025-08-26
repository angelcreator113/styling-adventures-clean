// dev-login.js
async function devLogin() {
  const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
  const auth = getAuth();

  try {
    const userCred = await signInWithEmailAndPassword(auth, "dev@styling.com", "password123");
    const token = await userCred.user.getIdToken();
    console.log("✅ Firebase ID Token:", token);

    // 🔐 Send token to backend
    const res = await fetch("http://localhost:3000/sessionLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token }),
      credentials: "include" // important for cookie-based session
    });

    const json = await res.json();
    console.log("🎉 Session login response:", json);
  } catch (err) {
    console.error("Login failed:", err);
  }
}

// Expose globally
if (typeof window !== "undefined") {
  window.devLogin = devLogin;
}
