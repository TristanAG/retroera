import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
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
      userId: user.uid,
    });

    // Also add to console-specific collection
    await addDoc(collection(db, "users", user.uid, "consoles", game.console, "games"), {
      title: game.title,
      console: game.console,
      condition: game.condition,
      estimated_value: game.estimated_value,
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

// Remove a game from Firestore
export const removeGame = async (gameId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const gameRef = doc(db, "users", user.uid, "games", gameId);

  try {
    await deleteDoc(gameRef);
  } catch (error) {
    console.error("Error removing game:", error.message);
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
