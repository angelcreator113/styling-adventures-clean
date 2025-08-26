// src/components/SidebarGreeting.jsx
import { useEffect, useState } from "react";
import { auth } from "../utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/init-firebase";

export default function SidebarGreeting() {
  const [greetingName, setGreetingName] = useState("Bestie");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setGreetingName(data.greetingName || user.displayName || "Bestie");

        if (data.lastLogin) {
          setReturning(true);
        }
        await updateDoc(ref, { lastLogin: new Date().toISOString() });
      } else {
        // First login
        await updateDoc(ref, {
          greetingName: user.displayName || "Bestie",
          lastLogin: new Date().toISOString(),
        });
        setReturning(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="sidebar-greeting">
      {returning
        ? `Bestie, ${greetingName}, Welcome Back!`
        : `Bestie, ${greetingName}, Welcome!`}
    </div>
  );
}
