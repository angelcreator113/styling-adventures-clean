// src/components/settings/UpgradeToCreatorPanel.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { auth, db } from "@/utils/init-firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { beginCreatorCheckout } from "@/utils/billing.js";

export default function UpgradeToCreatorPanel({ compact = false }) {
  const user = auth.currentUser;
  const [busy, setBusy] = useState(false);

  const onUpgrade = async () => {
    if (!user) return toast.error("Please sign in first.");
    setBusy(true);
    const t = toast.loading("Preparing your Creator upgrade…");
    try {
      // Mark intent; let billing flow/Cloud Functions finalize role & grant 2 spaces
      await setDoc(doc(db, `users/${user.uid}/settings/profile`), {
        uid: user.uid,
        roleChoice: "creator",
        checkoutRequired: true,
        upgradedFromFan: true,
        upgradedAt: serverTimestamp(),
      }, { merge: true });

      toast.success("Almost there! Redirecting to checkout…");
      toast.dismiss(t);
      await beginCreatorCheckout({ uid: user.uid, email: user.email || "" });
    } catch (e) {
      console.error(e);
      toast.dismiss(t);
      toast.error("Could not start upgrade. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-card" style={{ padding: compact ? 16 : 24 }}>
      <h3 style={{ marginTop: 0 }}>Become a Creator</h3>
      <p className="muted" style={{ marginTop: 4 }}>
        Publish your content with <strong>Spaces</strong>, unlock insights, and grow your audience.
        Upgrade today and get <strong>2 Spaces for free</strong> as a thank‑you for supporting the platform.
      </p>

      <ul style={{ margin: "10px 0 16px", paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Creator Studio with uploads & organization</li>
        <li>Spaces for campaigns/themes (2 free after upgrade)</li>
        <li>Analytics and growth tools</li>
      </ul>

      <button className="btn primary" disabled={busy} onClick={onUpgrade}>
        {busy ? "Please wait…" : "Upgrade to Creator"}
      </button>
    </div>
  );
}
