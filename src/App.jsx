import { useState, useEffect } from "react";
import { signUp, logIn, logOut } from "./authService";
import { addGame, getGames } from "./firestoreService";
import { auth } from "./firebase";
import 'bulma/css/bulma.min.css';

import Header from './components/Header'

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
      <Header user={user}/>
      

      
      
      {user && (
        <div class="welcome-wrapper">
          <p>Welcome, {user.email}</p>
          <button onClick={handleLogOut}>Log Out</button>
        </div>
      )}

      {user ? (
        <div className="section">
          <h2>My Game Collection</h2>
          
          <div className="add-form">
            <div className="field">
              <div className="control">
                <label class="label">Game Title</label>
                <input
                  type="text"
                  placeholder="Enter game title"
                  value={gameTitle}
                  className="input"
                  onChange={(e) => setGameTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <div className="control">
                <label class="label">Console</label>
                <input
                  type="text"
                  placeholder="Enter console"
                  value={consoleName}
                  className="input"
                  onChange={(e) => setConsoleName(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <div className="control">
                <label class="label">Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="input">
                  <option value="CIB">CIB (Complete in Box)</option>
                  <option value="Disc Only">Disc Only</option>
                  <option value="New">New</option>
                </select>
              </div>
            </div>

            <div className="field">
              <div className="control">
                <label class="label">Estimated Value</label>
                <input
                  type="number"
                  placeholder="Estimated Value"
                  value={estimatedValue}
                  className="input"
                  onChange={(e) => setEstimatedValue(e.target.value)}
                />
              </div>
            </div>
            <button onClick={handleAddGame}>Add Game</button>
          </div>

          <h3>Your Games:</h3>
          <ul>
            {games.map((game) => (
              <li key={game.id}>
                {game.title} - {game.console} ({game.condition}) - ${game.estimated_value}
              </li>
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
    </section>
  );
}

export default App;
