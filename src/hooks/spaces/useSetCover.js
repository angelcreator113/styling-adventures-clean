import { db } from "@/utils/init-firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { uploadFileWithProgress } from "@/utils/firebase-helpers";

/**
 * Uploads a cover image for a Space and updates coverUrl.
 * Usage: const setCover = useSetCover(uid, spaceId); await setCover(file);
 */
export default function useSetCover(uid, spaceId) {
  return async function setCover(file) {
    if (!uid || !spaceId || !file) return;

    const res = await uploadFileWithProgress(file, {
      slug: "spaces",
      public: false,
      uiPrefix: "space-cover",
      pathSuffix: `covers/${spaceId}`, // ensures path under images/users/{uid}/spaces/covers/{spaceId}
      metadata: {
        uid,
        spaceId,
        variant: "cover",
        contentType: file.type || "image/jpeg",
        cacheControl: "public,max-age=31536000",
      },
    });

    const coverUrl =
      res?.assets?.file?.url ||
      res?.downloadURL ||
      res?.url ||
      res?.assets?.preview?.url ||
      "";

    await updateDoc(doc(db, `users/${uid}/spaces/${spaceId}`), {
      coverUrl: coverUrl || null,
      updatedAt: serverTimestamp(),
      lastPreviewUrl: coverUrl || null,
    });

    return coverUrl;
  };
}
