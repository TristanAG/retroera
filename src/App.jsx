import { useState, useEffect } from "react";
import { signUp, logIn, logOut } from "./authService";
import {
  createCopyDraft,
  deleteCopyRecord,
  finalizeCopy,
  markCopyPrivate,
  migrateLegacyGames,
  removeDraftCopy,
  subscribeToOwnedCopies,
  updateCopy,
} from "./copyService";
import { deletePhotos, uploadCopyPhoto } from "./storageService";
import { CONSOLE_TO_IGDB_PLATFORM } from "./igdbService";
import { auth } from "./firebase";
import "bulma/css/bulma.min.css";

import Navigation from "./components/Navigation";
import Login from "./components/Login";
import AddGame from "./components/AddGame";
import EditGame from "./components/EditGame";
import GamesList from "./components/GamesList";
import Explore from "./components/Explore";
import Game from "./components/Game";
import Profile from "./components/Profile";
import CopyDetail from "./components/CopyDetail";

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
  const [visibility, setVisibility] = useState("private");
  const [photoItems, setPhotoItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [migrationIssues, setMigrationIssues] = useState([]);

  const [page, setPage] = useState("home");
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCommunityCopy, setSelectedCommunityCopy] = useState(null);
  const [gameReturnPage, setGameReturnPage] = useState("home");
  const [editingGame, setEditingGame] = useState(null);
  const [editReturnPage, setEditReturnPage] = useState("home");

  useEffect(() => {
    let unsubscribeCopies = null;
    let authGeneration = 0;
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      const generation = ++authGeneration;
      unsubscribeCopies?.();
      unsubscribeCopies = null;
      setUser(currentUser);
      if (currentUser) {
        try {
          const result = await migrateLegacyGames();
          setMigrationIssues(result.errors);
          if (result.errors.length > 0) {
            console.warn("Some collection records need migration attention", result.errors);
          }
        } catch (error) {
          console.error("Error migrating collection:", error);
        }
        if (
          generation !== authGeneration ||
          auth.currentUser?.uid !== currentUser.uid
        ) {
          return;
        }
        unsubscribeCopies = subscribeToOwnedCopies(
          setGames,
          (error) => console.error("Error loading collection:", error)
        );
      } else {
        setGames([]);
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeCopies?.();
    };
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
    photoItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setGameTitle("");
    setConsoleName("");
    setCondition("CIB");
    setEstimatedValue("");
    setIgdbId("");
    setVisibility("private");
    setPhotoItems([]);
    setUploadProgress(0);
    setSelectedGame(null);
  };

  const ownedCopiesForGame = (igdbId, igdbPlatformId) =>
    games.filter(
      (game) =>
        String(game.igdbId) === String(igdbId) &&
        Number(game.igdbPlatformId) === Number(igdbPlatformId)
    );

  const isGameInCollection = (igdbId, igdbPlatformId) =>
    games.some(
      (g) =>
        String(g.igdbId) === String(igdbId) &&
        Number(g.igdbPlatformId) === Number(igdbPlatformId)
    );

  const handleAddGameFromBrowse = () => {
    if (!selectedGame) return;
    setGameTitle(selectedGame.title);
    setConsoleName(selectedGame.console);
    setCondition("CIB");
    setEstimatedValue("");
    setIgdbId(String(selectedGame.igdbId));
    setVisibility("private");
    setPhotoItems([]);
    setPage("add-game");
  };

  const handleAddGame = async () => {
    if (!gameTitle || !consoleName || !estimatedValue)
      return alert("Fill in all fields!");
    if (!igdbId) return;
    const platformId = CONSOLE_TO_IGDB_PLATFORM[consoleName];
    if (!platformId) return alert("This console does not have a valid IGDB platform.");

    setIsSaving(true);
    setUploadProgress(0);
    let copyId = null;
    const uploadedPaths = [];
    try {
      copyId = await createCopyDraft({
        title: gameTitle,
        console: consoleName,
        condition,
        estimatedValue: parseFloat(estimatedValue),
        igdbId,
        igdbPlatformId: platformId,
      });

      for (let index = 0; index < photoItems.length; index += 1) {
        const item = photoItems[index];
        const path = await uploadCopyPhoto(
          user.uid,
          copyId,
          item.file,
          (progress) =>
            setUploadProgress(
              Math.round(((index + progress / 100) / photoItems.length) * 100)
            )
        );
        uploadedPaths.push(path);
      }

      await finalizeCopy(copyId, {
        condition,
        estimatedValue: parseFloat(estimatedValue),
        visibility,
        photoPaths: uploadedPaths,
      });
      const addedGame = {
        igdbId: String(igdbId),
        igdbPlatformId: platformId,
        title: gameTitle,
        console: consoleName,
      };
      resetAddGameForm();
      if (!selectedGame) {
        setGameReturnPage("home");
      }
      setSelectedGame(addedGame);
      setPage("game");
    } catch (error) {
      await deletePhotos(uploadedPaths).catch(console.error);
      if (copyId) await removeDraftCopy(copyId);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectGame = ({
    igdbId,
    igdbPlatformId,
    title,
    console: consoleName,
  }) => {
    setGameReturnPage(page);
    setSelectedGame({
      igdbId,
      igdbPlatformId:
        Number(igdbPlatformId) || CONSOLE_TO_IGDB_PLATFORM[consoleName],
      title,
      console: consoleName,
    });
    setPage("game");
  };

  const handleBackFromGame = () => {
    setSelectedGame(null);
    setPage(gameReturnPage);
  };

  const handleEditGame = (game, returnPage = page) => {
    photoItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setEditingGame(game);
    setCondition(game.condition);
    setEstimatedValue(String(game.estimated_value ?? ""));
    setVisibility(game.visibility ?? "private");
    setPhotoItems(
      (game.photoPaths ?? []).map((path) => ({ id: path, path }))
    );
    setUploadProgress(0);
    setEditReturnPage(returnPage);
    setPage("edit-game");
  };

  const handleCancelEdit = () => {
    photoItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setPhotoItems([]);
    setEditingGame(null);
    setPage(editReturnPage);
  };

  const handleSaveEdit = async () => {
    if (!editingGame || !estimatedValue) return alert("Fill in all fields!");
    setIsSaving(true);
    setUploadProgress(0);
    const newlyUploaded = [];
    try {
      if (editingGame.visibility === "public") {
        await markCopyPrivate(editingGame.id);
      }

      const finalPaths = [];
      const newItems = photoItems.filter((item) => item.file);
      let uploadedCount = 0;
      for (const item of photoItems) {
        if (item.path) {
          finalPaths.push(item.path);
          continue;
        }
        const path = await uploadCopyPhoto(
          user.uid,
          editingGame.id,
          item.file,
          (progress) =>
            setUploadProgress(
              Math.round(
                ((uploadedCount + progress / 100) / Math.max(1, newItems.length)) *
                  100
              )
            )
        );
        uploadedCount += 1;
        newlyUploaded.push(path);
        finalPaths.push(path);
      }

      await updateCopy(editingGame.id, {
        condition,
        estimatedValue: parseFloat(estimatedValue),
        visibility,
        photoPaths: finalPaths,
      });

      const removedPaths = (editingGame.photoPaths ?? []).filter(
        (path) => !finalPaths.includes(path)
      );
      await deletePhotos(removedPaths).catch((cleanupError) => {
        console.warn("Copy saved, but some removed photos need cleanup", cleanupError);
        alert(
          "Your copy was saved, but one or more removed photos could not be cleaned up."
        );
      });
      const returnPage = editReturnPage;
      if (returnPage === "game") {
        setSelectedGame({
          igdbId: String(editingGame.igdbId),
          igdbPlatformId: editingGame.igdbPlatformId,
          title: editingGame.title,
          console: editingGame.console,
        });
      }
      setEditingGame(null);
      photoItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setPhotoItems([]);
      setPage(returnPage);
    } catch (error) {
      await deletePhotos(newlyUploaded).catch(console.error);
      if (editingGame.visibility === "public") {
        await updateCopy(editingGame.id, {
          condition: editingGame.condition,
          estimatedValue: editingGame.estimated_value,
          visibility: "public",
          photoPaths: editingGame.photoPaths ?? [],
        }).catch(console.error);
      }
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGame = async (game, { navigateAfter = null } = {}) => {
    if (!window.confirm(`Remove "${game.title}" from your collection?`)) return;
    try {
      await markCopyPrivate(game.id);
      await deletePhotos(game.photoPaths ?? []);
      await deleteCopyRecord(game.id);
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
          {migrationIssues.length > 0 && (
            <div className="notification is-warning">
              <strong>Some legacy games need migration attention.</strong>
              <ul className="mt-2">
                {migrationIssues.map((issue) => (
                  <li key={issue.legacyGameId}>
                    {issue.title}: {issue.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                  igdbPlatformId={selectedGame.igdbPlatformId}
                  consoleName={selectedGame.console}
                  title={selectedGame.title}
                  isInCollection={isGameInCollection(
                    selectedGame.igdbId,
                    selectedGame.igdbPlatformId
                  )}
                  ownedCopies={ownedCopiesForGame(
                    selectedGame.igdbId,
                    selectedGame.igdbPlatformId
                  )}
                  currentUserId={user.uid}
                  onAddToCollection={handleAddGameFromBrowse}
                  onEditGame={(game) => handleEditGame(game, "game")}
                  onDeleteGame={(game) => handleDeleteGame(game)}
                  onSelectCommunityCopy={(copy) => {
                    setSelectedCommunityCopy(copy);
                    setPage("copy-detail");
                  }}
                  onBack={handleBackFromGame}
                />
              ) : (
                <p>Game data not available. Please select a valid game.</p>
              )}
            </>
          )}

          {page === "user" && (
            <CenteredPage>
              <Profile user={user} />
            </CenteredPage>
          )}

          {page === "copy-detail" && selectedCommunityCopy && (
            <CopyDetail
              copy={selectedCommunityCopy}
              onBack={() => {
                setSelectedCommunityCopy(null);
                setPage("game");
              }}
            />
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
                  visibility={visibility}
                  setVisibility={setVisibility}
                  photoItems={photoItems}
                  setPhotoItems={setPhotoItems}
                  isSaving={isSaving}
                  uploadProgress={uploadProgress}
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
                visibility={visibility}
                setVisibility={setVisibility}
                photoItems={photoItems}
                setPhotoItems={setPhotoItems}
                isSaving={isSaving}
                uploadProgress={uploadProgress}
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
