import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";

// Add a new game to Firestore
export const addGame = async (game) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    await addDoc(collection(db, "users", user.uid, "games"), {
      title: game.title,
      console: game.console,
      condition: game.condition,
      estimated_value: game.estimated_value,
      igdb_id: String(game.igdb_id),
      userId: user.uid,
    });

    // Also add to console-specific collection
    await addDoc(collection(db, "users", user.uid, "consoles", game.console, "games"), {
      title: game.title,
      console: game.console,
      condition: game.condition,
      estimated_value: game.estimated_value,
      igdb_id: String(game.igdb_id),
      userId: user.uid,
    });

    // Add/overwrite console doc (for console list)
    await setDoc(doc(db, "users", user.uid, "consoles", game.console), {
      name: game.console,
    });

  } catch (error) {
    console.error("Error adding game:", error.message);
    throw error;
  }
};

// Fetch user's games from Firestore
export const getGames = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const gamesRef = collection(db, "users", user.uid, "games");
  const q = query(gamesRef, where("userId", "==", user.uid));

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching games:", error.message);
    throw error;
  }
};

// Remove a game from Firestore (flat list + console subcollection)
export const removeGame = async (gameId, consoleName, igdbId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    await deleteDoc(doc(db, "users", user.uid, "games", gameId));

    const consoleGamesRef = collection(
      db,
      "users",
      user.uid,
      "consoles",
      consoleName,
      "games"
    );
    const consoleQuery = query(
      consoleGamesRef,
      where("igdb_id", "==", String(igdbId))
    );
    const consoleSnapshot = await getDocs(consoleQuery);
    await Promise.all(consoleSnapshot.docs.map((d) => deleteDoc(d.ref)));

    const remainingGamesSnapshot = await getDocs(consoleGamesRef);
    if (remainingGamesSnapshot.empty) {
      await deleteDoc(doc(db, "users", user.uid, "consoles", consoleName));
    }
  } catch (error) {
    console.error("Error removing game:", error.message);
    throw error;
  }
};

// Remove console docs that have no games (repairs stale entries from before delete cleanup)
export const pruneEmptyConsoles = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const consolesRef = collection(db, "users", user.uid, "consoles");
    const consolesSnapshot = await getDocs(consolesRef);

    await Promise.all(
      consolesSnapshot.docs.map(async (consoleDoc) => {
        const gamesSnapshot = await getDocs(collection(consoleDoc.ref, "games"));
        if (gamesSnapshot.empty) {
          await deleteDoc(consoleDoc.ref);
        }
      })
    );
  } catch (error) {
    console.error("Error pruning empty consoles:", error.message);
    throw error;
  }
};

// Update a game in Firestore (flat list + console subcollection)
export const updateGame = async (gameId, consoleName, igdbId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const payload = {
    condition: updates.condition,
    estimated_value: updates.estimated_value,
  };

  try {
    await updateDoc(doc(db, "users", user.uid, "games", gameId), payload);

    const consoleGamesRef = collection(
      db,
      "users",
      user.uid,
      "consoles",
      consoleName,
      "games"
    );
    const consoleQuery = query(
      consoleGamesRef,
      where("igdb_id", "==", String(igdbId))
    );
    const consoleSnapshot = await getDocs(consoleQuery);
    await Promise.all(
      consoleSnapshot.docs.map((d) => updateDoc(d.ref, payload))
    );
  } catch (error) {
    console.error("Error updating game:", error.message);
    throw error;
  }
};

// Fetch user's console list (static fetch)
export const getConsoles = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const consolesRef = collection(db, "users", user.uid, "consoles");
  const consolesSnapshot = await getDocs(consolesRef);
  return consolesSnapshot.docs.map((doc) => doc.id);
};

// 🔥 Subscribe to user's consoles in real-time
export const subscribeToConsoles = (onUpdate) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const consolesRef = collection(db, "users", user.uid, "consoles");

  return onSnapshot(consolesRef, (snapshot) => {
    const consoleNames = snapshot.docs.map((doc) => doc.id);
    onUpdate(consoleNames);
  });
};

// Fetch games for a specific console for current user
export const getGamesByConsole = async (consoleName) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const gamesRef = collection(db, "users", user.uid, "consoles", consoleName, "games");
  const querySnapshot = await getDocs(gamesRef);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Subscribe to real-time updates of games for a specific console for current user
export const subscribeToGamesByConsole = (consoleName, callback) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const gamesRef = collection(db, "users", user.uid, "consoles", consoleName, "games");
  const q = query(gamesRef);

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(games);
  });

  return unsubscribe;
};
