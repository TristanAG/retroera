import { auth, db } from "./firebase";
import {
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  collection,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

export const fallbackDisplayName = (uid = "") =>
  `Collector ${uid.slice(0, 6).toUpperCase() || "Retro"}`;

export const getProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, "profiles", uid));
  if (!snapshot.exists()) {
    return { uid, displayName: fallbackDisplayName(uid) };
  }
  return { uid: snapshot.id, ...snapshot.data() };
};

export const getProfiles = async (uids) => {
  const uniqueIds = [...new Set(uids.filter(Boolean))];
  const profiles = new Map();

  for (let offset = 0; offset < uniqueIds.length; offset += 30) {
    const chunk = uniqueIds.slice(offset, offset + 30);
    const snapshot = await getDocs(
      query(collection(db, "profiles"), where(documentId(), "in", chunk))
    );
    snapshot.docs.forEach((profileDoc) => {
      profiles.set(profileDoc.id, { uid: profileDoc.id, ...profileDoc.data() });
    });
  }

  uniqueIds.forEach((uid) => {
    if (!profiles.has(uid)) {
      profiles.set(uid, { uid, displayName: fallbackDisplayName(uid) });
    }
  });
  return profiles;
};

export const saveMyProfile = async (displayName) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const normalized = displayName.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 40) {
    throw new Error("Display name must be between 2 and 40 characters");
  }

  await setDoc(
    doc(db, "profiles", user.uid),
    {
      displayName: normalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return { uid: user.uid, displayName: normalized };
};
