import { useState, useEffect } from "react";
import { signUp, logIn, logOut } from "./authService";
import { addGame, getGames } from "./firestoreService";
import { auth } from "./firebase";
import "bulma/css/bulma.min.css";

import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Login from "./components/Login";
import AddGame from "./components/AddGame";
import GamesList from "./components/GamesList";
import Explore from "./components/Explore";

import DreamcastGames from "./components/DreamcastGames";

// ✅ Moved outside App so it doesn't remount on every render
const CenteredPage = ({ children }) => (
  <div
    className="section is-flex is-justify-content-center"
    style={{ minHeight: "80vh" }}
  >
    <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
      {children}
    </div>
  </div>
);

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);

  const [gameTitle, setGameTitle] = useState("");
  const [consoleName, setConsoleName] = useState("");
  const [condition, setCondition] = useState("CIB");
  const [estimatedValue, setEstimatedValue] = useState("");

  const [page, setPage] = useState("home");

  // ✅ Selected game for Game view
  const [selectedGame, setSelectedGame] = useState(null);

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
    setSelectedGame(null);
    setPage("home");
  };

  const handleAddGame = async () => {
    if (!gameTitle || !consoleName || !estimatedValue)
      return alert("Fill in all fields!");
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
      <Header user={user} onLogOut={handleLogOut} setPage={setPage} />

      {user && (
        <Navigation setPage={setPage} user={user} onLogOut={handleLogOut} />
      )}

      {user ? (
        <div className="section">
          {page === "home" && (
            <GamesList
              games={games}
              setPage={setPage}
              setSelectedGame={setSelectedGame}
            />
          )}

          {page === "collection" && (
            <GamesList
              games={games}
              setPage={setPage}
              setSelectedGame={setSelectedGame}
            />
          )}

          {page === "game" && selectedGame && (
            <CenteredPage>
              <div>
                <p className="is-size-7 has-text-grey">Game Page (placeholder)</p>

                <h2 className="is-size-2 has-text-weight-bold">
                  {selectedGame.title}
                </h2>

                <p className="is-size-6">
                  <strong>Console:</strong> {selectedGame.console}
                </p>

                <p className="is-size-6">
                  <strong>Condition:</strong> {selectedGame.condition}
                </p>

                <p className="is-size-6">
                  <strong>Estimated Value:</strong>{" "}
                  <span className="has-text-success-65">
                    ${selectedGame.estimated_value}
                  </span>
                </p>

                <button
                  className="button is-link is-light mt-4"
                  onClick={() => setPage("collection")}
                >
                  ← Back to Collection
                </button>
              </div>
            </CenteredPage>
          )}

          {page === "user" && (
            <CenteredPage>
              <p>User page</p>
            </CenteredPage>
          )}

          {page === "add-game" && (
            <CenteredPage>
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
            </CenteredPage>
          )}

          {page === "explore" && <Explore />}
        </div>
      ) : (
        <div
          className="section is-flex is-justify-content-center is-align-items-center"
          style={{ minHeight: "100vh" }}
        >
          <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
            <h1 className="is-size-1 has-text-link-90">RetroEra</h1>
            <p style={{ textAlign: "center" }}>Stay Retro.</p>
            <Login
              onLogin={handleLogIn}
              onSignUp={handleSignUp}
              setPassword={setPassword}
              password={password}
              setEmail={setEmail}
              email={email}
            />
          </div>
        </div>
      )}

      <DreamcastGames />
    </section>
  );
}

export default App;
