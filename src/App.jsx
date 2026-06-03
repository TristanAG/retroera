import { useState, useEffect } from "react";
import { signUp, logIn, logOut } from "./authService";
import { addGame, getGames, removeGame, updateGame } from "./firestoreService";
import { auth } from "./firebase";
import "bulma/css/bulma.min.css";

import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Login from "./components/Login";
import AddGame from "./components/AddGame";
import EditGame from "./components/EditGame";
import GamesList from "./components/GamesList";
import Explore from "./components/Explore";
import Game from "./components/Game";

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
  const [igdbId, setIgdbId] = useState("");

  const [page, setPage] = useState("home");
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameReturnPage, setGameReturnPage] = useState("home");
  const [editingGame, setEditingGame] = useState(null);
  const [editReturnPage, setEditReturnPage] = useState("home");

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

  const resetAddGameForm = () => {
    setGameTitle("");
    setConsoleName("");
    setCondition("CIB");
    setEstimatedValue("");
    setIgdbId("");
  };

  const isGameInCollection = (igdbId, console) =>
    games.some(
      (g) =>
        String(g.igdb_id).trim() === String(igdbId) &&
        g.console === console
    );

  const findCollectionGame = (igdbId, console) =>
    games.find(
      (g) =>
        String(g.igdb_id).trim() === String(igdbId) &&
        g.console === console
    );

  const handleAddGameFromBrowse = () => {
    if (!selectedGame) return;
    setGameTitle(selectedGame.title);
    setConsoleName(selectedGame.console);
    setCondition("CIB");
    setEstimatedValue("");
    setIgdbId(String(selectedGame.igdbId));
    setPage("add-game");
  };

  const handleAddGame = async () => {
    if (!gameTitle || !consoleName || !estimatedValue)
      return alert("Fill in all fields!");
    if (!igdbId) return;
    try {
      await addGame({
        title: gameTitle,
        console: consoleName,
        condition,
        estimated_value: parseFloat(estimatedValue),
        igdb_id: igdbId,
        userId: user.uid,
      });
      const addedGame = {
        igdbId: String(igdbId),
        title: gameTitle,
        console: consoleName,
      };
      resetAddGameForm();
      await fetchGames();
      if (!selectedGame) {
        setGameReturnPage("home");
      }
      setSelectedGame(addedGame);
      setPage("game");
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

  const handleSelectGame = ({ igdbId, title, console: consoleName }) => {
    setGameReturnPage(page);
    setSelectedGame({ igdbId, title, console: consoleName });
    setPage("game");
  };

  const handleBackFromGame = () => {
    setSelectedGame(null);
    setPage(gameReturnPage);
  };

  const handleEditGame = (game, returnPage = page) => {
    setEditingGame(game);
    setCondition(game.condition);
    setEstimatedValue(String(game.estimated_value ?? ""));
    setEditReturnPage(returnPage);
    setPage("edit-game");
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
    setPage(editReturnPage);
  };

  const handleSaveEdit = async () => {
    if (!editingGame || !estimatedValue) return alert("Fill in all fields!");
    try {
      await updateGame(
        editingGame.id,
        editingGame.console,
        editingGame.igdb_id,
        {
          condition,
          estimated_value: parseFloat(estimatedValue),
        }
      );
      await fetchGames();
      const returnPage = editReturnPage;
      if (returnPage === "game") {
        setSelectedGame({
          igdbId: String(editingGame.igdb_id).trim(),
          title: editingGame.title,
          console: editingGame.console,
        });
      }
      setEditingGame(null);
      setPage(returnPage);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteGame = async (game, { navigateAfter = null } = {}) => {
    if (!window.confirm(`Remove "${game.title}" from your collection?`)) return;
    try {
      await removeGame(game.id, game.console, game.igdb_id);
      await fetchGames();
      if (navigateAfter) {
        setSelectedGame(null);
        setPage(navigateAfter);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <section className="section">
      <Header user={user} onLogOut={handleLogOut} setPage={setPage} />

      {user && (
        <Navigation
          setPage={setPage}
          user={user}
          onLogOut={handleLogOut}
          resetAddGameForm={resetAddGameForm}
        />
      )}

      {user ? (
        <div style={{ padding: "15px" }}>
          {page === "home" && (
            <GamesList
              games={games}
              onSelectGame={handleSelectGame}
              onEditGame={(game) => handleEditGame(game, "home")}
              onDeleteGame={(game) => handleDeleteGame(game)}
            />
          )}

          {page === "collection" && (
            <GamesList
              games={games}
              onSelectGame={handleSelectGame}
              onEditGame={(game) => handleEditGame(game, "collection")}
              onDeleteGame={(game) => handleDeleteGame(game)}
            />
          )}

          {page === "game" && (
            <>
              {selectedGame ? (
                <Game
                  igdbId={selectedGame.igdbId}
                  title={selectedGame.title}
                  isInCollection={isGameInCollection(
                    selectedGame.igdbId,
                    selectedGame.console
                  )}
                  collectionGame={findCollectionGame(
                    selectedGame.igdbId,
                    selectedGame.console
                  )}
                  onAddToCollection={handleAddGameFromBrowse}
                  onEditGame={(game) => handleEditGame(game, "game")}
                  onDeleteGame={(game) =>
                    handleDeleteGame(game, { navigateAfter: gameReturnPage })
                  }
                  onBack={handleBackFromGame}
                />
              ) : (
                <p>Game data not available. Please select a valid game.</p>
              )}
            </>
          )}

          {page === "user" && (
            <CenteredPage>
              <p>User page</p>
            </CenteredPage>
          )}

          {page === "edit-game" && (
            <CenteredPage>
              {editingGame ? (
                <EditGame
                  game={editingGame}
                  condition={condition}
                  setCondition={setCondition}
                  estimatedValue={estimatedValue}
                  setEstimatedValue={setEstimatedValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <p>Game data not available. Please select a valid game.</p>
              )}
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
                igdbId={igdbId}
                setIgdbId={setIgdbId}
                handleAddGame={handleAddGame}
              />
            </CenteredPage>
          )}

          {(page === "explore" ||
            (page === "game" && gameReturnPage === "explore")) && (
            <div style={{ display: page === "explore" ? "block" : "none" }}>
              <Explore onSelectGame={handleSelectGame} />
            </div>
          )}
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
    </section>
  );
}

export default App;
