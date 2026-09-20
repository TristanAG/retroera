import { auth, db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { CONSOLE_TO_IGDB_PLATFORM } from "./igdbService";

const MIGRATION_VERSION = 1;
const MIGRATION_BATCH_SIZE = 150;

const requireUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user;
};

const publicCopyPayload = (copy, ownerId) => ({
  ownerId,
  igdbId: String(copy.igdbId),
  igdbPlatformId: Number(copy.igdbPlatformId),
  console: copy.console,
  title: copy.title,
  condition: copy.condition,
  visibility: copy.visibility === "public" ? "public" : "private",
  photoPaths: Array.isArray(copy.photoPaths) ? copy.photoPaths.slice(0, 5) : [],
});

const mergeOwnedCopies = (copies, privateData) =>
  copies.map((copy) => ({
    ...copy,
    estimated_value: privateData.get(copy.id)?.estimatedValue ?? 0,
    igdb_id: copy.igdbId,
    igdb_platform_id: copy.igdbPlatformId,
  }));

export const subscribeToOwnedCopies = (onUpdate, onError = console.error) => {
  const user = requireUser();
  let copies = [];
  let privateData = new Map();

  const emit = () => onUpdate(mergeOwnedCopies(copies, privateData));

  const copiesQuery = query(
    collection(db, "copies"),
    where("ownerId", "==", user.uid)
  );
  const unsubscribeCopies = onSnapshot(
    copiesQuery,
    (snapshot) => {
      copies = snapshot.docs.map((copyDoc) => ({
        id: copyDoc.id,
        ...copyDoc.data(),
      }));
      emit();
    },
    onError
  );

  const unsubscribePrivate = onSnapshot(
    collection(db, "users", user.uid, "copyPrivate"),
    (snapshot) => {
      privateData = new Map(
        snapshot.docs.map((privateDoc) => [privateDoc.id, privateDoc.data()])
      );
      emit();
    },
    onError
  );

  return () => {
    unsubscribeCopies();
    unsubscribePrivate();
  };
};

export const createCopyDraft = async (copy) => {
  const user = requireUser();
  const copyRef = doc(collection(db, "copies"));
  const batch = writeBatch(db);

  batch.set(copyRef, {
    ...publicCopyPayload({ ...copy, visibility: "private", photoPaths: [] }, user.uid),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", user.uid, "copyPrivate", copyRef.id), {
    estimatedValue: Number(copy.estimatedValue) || 0,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return copyRef.id;
};

export const finalizeCopy = async (copyId, updates) => {
  const user = requireUser();
  const batch = writeBatch(db);
  const copyRef = doc(db, "copies", copyId);

  batch.update(copyRef, {
    condition: updates.condition,
    visibility: updates.visibility === "public" ? "public" : "private",
    photoPaths: (updates.photoPaths ?? []).slice(0, 5),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(db, "users", user.uid, "copyPrivate", copyId),
    {
      estimatedValue: Number(updates.estimatedValue) || 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await batch.commit();
};

export const updateCopy = finalizeCopy;

export const deleteCopyRecord = async (copyId) => {
  const user = requireUser();
  const batch = writeBatch(db);
  batch.delete(doc(db, "copies", copyId));
  batch.delete(doc(db, "users", user.uid, "copyPrivate", copyId));
  await batch.commit();
};

export const getPublicCopiesByGame = async (
  igdbId,
  igdbPlatformId,
  resultLimit = 24
) => {
  requireUser();
  const publicQuery = query(
    collection(db, "copies"),
    where("igdbId", "==", String(igdbId)),
    where("igdbPlatformId", "==", Number(igdbPlatformId)),
    where("visibility", "==", "public"),
    limit(resultLimit)
  );
  const snapshot = await getDocs(publicQuery);
  return snapshot.docs.map((copyDoc) => ({ id: copyDoc.id, ...copyDoc.data() }));
};

export const getPublicCopy = async (copyId) => {
  const snapshot = await getDoc(doc(db, "copies", copyId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

export const migrateLegacyGames = async () => {
  const user = requireUser();
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);
  if (userSnapshot.data()?.copyMigrationVersion >= MIGRATION_VERSION) {
    return { migrated: 0, skipped: true, errors: [] };
  }

  const legacySnapshot = await getDocs(
    collection(db, "users", user.uid, "games")
  );
  const existingCopiesSnapshot = await getDocs(
    query(collection(db, "copies"), where("ownerId", "==", user.uid))
  );
  const existingCopyIds = new Set(
    existingCopiesSnapshot.docs.map((copyDoc) => copyDoc.id)
  );
  const errors = [];
  let migrated = 0;

  for (let offset = 0; offset < legacySnapshot.docs.length; offset += MIGRATION_BATCH_SIZE) {
    const legacyBatch = legacySnapshot.docs.slice(
      offset,
      offset + MIGRATION_BATCH_SIZE
    );
    const batch = writeBatch(db);

    for (const legacyDoc of legacyBatch) {
      const legacy = legacyDoc.data();
      const platformId = CONSOLE_TO_IGDB_PLATFORM[legacy.console];
      if (!platformId || !legacy.igdb_id) {
        errors.push({
          legacyGameId: legacyDoc.id,
          title: legacy.title ?? "Unknown",
          reason: !platformId ? `Unmapped console: ${legacy.console}` : "Missing IGDB ID",
        });
        continue;
      }

      const copyId = `${user.uid}_${legacyDoc.id}`;
      if (existingCopyIds.has(copyId)) continue;
      batch.set(
        doc(db, "copies", copyId),
        {
          ownerId: user.uid,
          igdbId: String(legacy.igdb_id).trim(),
          igdbPlatformId: Number(platformId),
          console: legacy.console,
          title: legacy.title,
          condition: legacy.condition ?? "CIB",
          visibility: "private",
          photoPaths: [],
          legacyGameId: legacyDoc.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      batch.set(
        doc(db, "users", user.uid, "copyPrivate", copyId),
        {
          estimatedValue: Number(legacy.estimated_value) || 0,
          legacyGameId: legacyDoc.id,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      migrated += 1;
    }

    await batch.commit();
    await setDoc(
      userRef,
      {
        copyMigrationProgress: Math.min(
          offset + legacyBatch.length,
          legacySnapshot.docs.length
        ),
        copyMigrationTotal: legacySnapshot.docs.length,
        copyMigrationErrors: errors,
      },
      { merge: true }
    );
  }

  const migratedSnapshot = await getDocs(
    query(collection(db, "copies"), where("ownerId", "==", user.uid))
  );
  const migratedLegacyIds = new Set(
    migratedSnapshot.docs
      .map((copyDoc) => copyDoc.data().legacyGameId)
      .filter(Boolean)
  );
  for (const legacyDoc of legacySnapshot.docs) {
    const legacy = legacyDoc.data();
    if (
      CONSOLE_TO_IGDB_PLATFORM[legacy.console] &&
      legacy.igdb_id &&
      !migratedLegacyIds.has(legacyDoc.id)
    ) {
      errors.push({
        legacyGameId: legacyDoc.id,
        title: legacy.title ?? "Unknown",
        reason: "Target copy could not be verified",
      });
    }
  }

  if (errors.length === 0) {
    await setDoc(
      userRef,
      {
        copyMigrationVersion: MIGRATION_VERSION,
        copyMigrationCompletedAt: serverTimestamp(),
        copyMigrationErrors: [],
      },
      { merge: true }
    );
  }

  return { migrated, skipped: false, errors };
};

export const submitCopyReport = async (copyId, reason) => {
  const user = requireUser();
  const reportRef = doc(collection(db, "reports"));
  await setDoc(reportRef, {
    copyId,
    reporterId: user.uid,
    reason,
    status: "open",
    createdAt: serverTimestamp(),
  });
  return reportRef.id;
};

export const removeDraftCopy = async (copyId) => {
  try {
    await deleteCopyRecord(copyId);
  } catch (error) {
    console.error("Unable to remove draft copy", error);
  }
};

export const markCopyPrivate = async (copyId) => {
  await updateDoc(doc(db, "copies", copyId), {
    visibility: "private",
    updatedAt: serverTimestamp(),
  });
};
