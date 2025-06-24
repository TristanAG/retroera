import { useEffect, useState } from "react";
import { subscribeToConsoles, getGamesByConsole } from "../firestoreService";

const GamesList = ({ games }) => {
  const [consoles, setConsoles] = useState([]);
  const [selectedConsoleGames, setSelectedConsoleGames] = useState([]);
  const [activeView, setActiveView] = useState("all"); // 🔥 NEW: track selected menu option

  // Subscribe to consoles in real-time on mount
  useEffect(() => {
    const unsubscribe = subscribeToConsoles(setConsoles);
    return () => unsubscribe();
  }, []);

  const handleSelectConsole = async (consoleName) => {
    try {
      const games = await getGamesByConsole(consoleName);
      setSelectedConsoleGames(games);
      setActiveView(consoleName); // 🔥 NEW: set active view to selected console
    } catch (error) {
      console.error("Error fetching games by console:", error.message);
    }
  };

  const handleShowAllGames = () => {
    setActiveView("all"); // 🔥 NEW: show the full games list
    setSelectedConsoleGames([]);
  };

  return (
    <div>
      <h3>Your Consoles:</h3>
      <ul className="user-console-list">
        <li key="all">
          <p
            className={`has-text-info ${activeView === "all" ? "has-text-weight-bold" : ""}`}
            onClick={handleShowAllGames}
          >
            All Games
          </p>
        </li>
        {consoles.map((consoleName) => (
          <li key={consoleName}>
            <p
              className={`has-text-info ${activeView === consoleName ? "has-text-weight-bold" : ""}`}
              onClick={() => handleSelectConsole(consoleName)}
            >
              {consoleName}
            </p>
          </li>
        ))}
      </ul>

      {/* 🔥 CONDITIONAL RENDERING */}
      {activeView === "all" && (
        <>
          <h3>Your Games:</h3>
          <ul>
            {games.map((game) => (
              <li key={game.id}>
                {game.title} - {game.console} ({game.condition}) - ${game.estimated_value}
              </li>
            ))}
          </ul>
        </>
      )}

      {activeView !== "all" && selectedConsoleGames.length > 0 && (
        <>
          <h4>Games for {selectedConsoleGames[0]?.console}:</h4>
          <ul>
            {selectedConsoleGames.map((game) => (
              <li key={game.id}>
                {game.title} ({game.condition}) - ${game.estimated_value}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default GamesList;
