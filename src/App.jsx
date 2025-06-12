import { useState, useEffect } from "react";
import { signUp, logIn, logOut } from "./authService";
import { addGame, getGames } from "./firestoreService";
import { auth } from "./firebase";
import 'bulma/css/bulma.min.css';

import Header from './components/Header'
import AddGame from './components/AddGame'
import GamesList from './components/GamesList'

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [gameTitle, setGameTitle] = useState("");
  const [consoleName, setConsoleName] = useState("");
  const [condition, setCondition] = useState("CIB");
  const [estimatedValue, setEstimatedValue] = useState("");

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
    console.log('test')
    await logOut();
    setUser(null);
    setGames([]);
  };

  const handleAddGame = async () => {
    if (!gameTitle || !consoleName || !estimatedValue) return alert("Fill in all fields!");
    try {
      await addGame({
        title: gameTitle,
        console: consoleName,
        condition,
        estimated_value: parseFloat(estimatedValue),
        userId: user.uid,
      });
      setGameTitle("");
      setConsoleName("");
      setCondition("CIB");
      setEstimatedValue("");
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
    <section className="section">
      <Header user={user} onLogOut={handleLogOut} />

      {user ? (
        <div className="section">

          <AddGame
            gameTitle={gameTitle}
            setGameTitle={setGameTitle}
            consoleName={consoleName}
            setConsoleName={setConsoleName}
            condition={condition}
            setCondition={setCondition}
            estimatedValue={estimatedValue}
            setEstimatedValue={setEstimatedValue}
            handleAddGame={handleAddGame}
          />
          
        <GamesList games={games} />

          {/* <h3>Your Games:</h3>

          <ul>
            {games.map((game) => (
              <li key={game.id}>
                {game.title} - {game.console} ({game.condition}) - ${game.estimated_value}
              </li>
            ))}
          </ul>  */}

        </div>
      ) : (
        <div>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleLogIn}>Log In</button>
        </div>
      )}
    </section>
  );
}

export default App;
