import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/init-firebase";

/** Reactive UID (don’t rely on auth.currentUser only at first render). */
export default function useUid() {
  const [uid, setUid] = useState(auth.currentUser?.uid || null);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
      setLoading(false);
    });
    return off;
  }, []);

  return { uid, loading };
}
