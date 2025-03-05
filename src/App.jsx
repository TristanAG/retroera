import { useState, useEffect } from "react";
import { signUp, logIn, logOut } from "./authService";
import { addGame, getGames } from "./firestoreService";
import { auth } from "./firebase";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [gameTitle, setGameTitle] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchGames();
    });
    return () => unsubscribe();
  }, []);

  const handleSignUp = async () => {
    try {
      const newUser = await signUp(email, password);
      setUser(newUser);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogIn = async () => {
    try {
      const loggedInUser = await logIn(email, password);
      setUser(loggedInUser);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogOut = async () => {
    await logOut();
    setUser(null);
    setGames([]);
  };

  const handleAddGame = async () => {
    if (!gameTitle) return alert("Enter a game title!");
    try {
      await addGame({ title: gameTitle, userId: user.uid });
      setGameTitle("");
      fetchGames();
    } catch (error) {
      alert(error.message);
    }
  };

  const fetchGames = async () => {
    try {
      const userGames = await getGames();
      setGames(userGames);
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  return (
    <div>
      <h1>Retrobay</h1>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button onClick={handleLogOut}>Log Out</button>

          <h2>My Game Collection</h2>
          <input
            type="text"
            placeholder="Enter game title"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
          />
          <button onClick={handleAddGame}>Add Game</button>

          <ul>
            {games.map((game) => (
              <li key={game.id}>{game.title}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleLogIn}>Log In</button>
        </div>
      )}
    </div>
  );
}

export default App;
