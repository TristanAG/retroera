import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// Add a new game to Firestore
export const addGame = async (game) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    await addDoc(collection(db, "users", user.uid, "games"), game);
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
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching games:", error.message);
    throw error;
  }
};
