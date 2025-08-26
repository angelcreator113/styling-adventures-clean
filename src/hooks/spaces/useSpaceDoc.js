import { useEffect, useState } from "react";
import { db } from "@/utils/init-firebase";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * Live “Space” doc.
 * Usage: const { space, loading, missing, error } = useSpaceDoc(uid, spaceId)
 */
export default function useSpaceDoc(uid, spaceId) {
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(!!uid && !!spaceId);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !spaceId) { setSpace(null); setMissing(false); setLoading(false); return; }
    setLoading(true);
    const ref = doc(db, `users/${uid}/spaces/${spaceId}`);
    const off = onSnapshot(ref,
      (snap) => {
        setLoading(false);
        if (!snap.exists()) { setMissing(true); setSpace(null); return; }
        setMissing(false);
        setSpace({ id: snap.id, ...snap.data() });
      },
      (err) => { setLoading(false); setError(err); }
    );
    return off;
  }, [uid, spaceId]);

  return { space, loading, missing, error };
}
