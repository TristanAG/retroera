import { useEffect, useState } from "react";
import {
  subscribeToConsoles,
  subscribeToGamesByConsole,
} from "../firestoreService";

const GamesList = ({ games, setPage, setSelectedGame }) => {
  const [consoles, setConsoles] = useState([]);
  const [selectedConsoleGames, setSelectedConsoleGames] = useState([]);
  const [selectedConsole, setSelectedConsole] = useState(null);

  // Subscribe to consoles list in real-time
  useEffect(() => {
    const unsubscribe = subscribeToConsoles(setConsoles);
    return () => unsubscribe();
  }, []);

  // Subscribe to games of selected console in real-time
  useEffect(() => {
    if (!selectedConsole) {
      setSelectedConsoleGames([]);
      return;
    }
    const unsubscribe = subscribeToGamesByConsole(
      selectedConsole,
      setSelectedConsoleGames
    );
    return () => unsubscribe();
  }, [selectedConsole]);

  // Calculate total value for all games
  const totalValueAllGames = games.reduce(
    (sum, game) => sum + (parseFloat(game.estimated_value) || 0),
    0
  );

  // Calculate total value for selected console's games
  const totalValueSelectedConsole = selectedConsoleGames.reduce(
    (sum, game) => sum + (parseFloat(game.estimated_value) || 0),
    0
  );

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setPage("game");
  };

  return (
    <div style={{ margin: "0 auto" }}>
      <ul className="user-console-list">
        <li>
          <span
            className={`tag is-size-6 ${
              selectedConsole === null
                ? "has-background-link-90"
                : "is-light"
            }`}
            onClick={() => setSelectedConsole(null)}
            style={{ cursor: "pointer" }}
          >
            All Games
          </span>
        </li>

        {consoles.map((consoleName) => (
          <li
            key={consoleName}
            className={consoleName.split(" ").join("-").toLowerCase()}
          >
            <span
              className={`tag is-size-6 ${
                selectedConsole === consoleName
                  ? "has-background-link-90"
                  : "is-light"
              }`}
              onClick={() => setSelectedConsole(consoleName)}
              style={{ cursor: "pointer" }}
            >
              {consoleName}
            </span>
          </li>
        ))}
      </ul>

      {selectedConsole === null ? (
        <>
          <p>
            <strong>Total Value:</strong> ${totalValueAllGames.toFixed(2)}
          </p>

          <table className="table is-striped is-fullwidth">
            <thead>
              <tr>
                <th>Game</th>
                <th>Condition</th>
                <th>Value</th>
              </tr>
            </thead>

            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <td>
                    <span
                      className="has-text-link has-text-weight-semibold"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleGameClick(game)}
                    >
                      {game.title}
                    </span>
                  </td>
                  <td>{game.condition}</td>
                  <td className="has-text-success-65 has-text-weight-semibold">
                    ${game.estimated_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h4 className="is-size-3">{selectedConsole}</h4>
          <p className="is-size-6">
            Total Value:{" "}
            <span className="has-text-success-65 has-text-weight-semibold">
              ${totalValueSelectedConsole.toFixed(2)}
            </span>
          </p>

          <table className="table is-striped is-fullwidth">
            <thead>
              <tr>
                <th>Game</th>
                <th>Condition</th>
                <th>Value</th>
              </tr>
            </thead>

            <tbody>
              {selectedConsoleGames.map((game) => (
                <tr key={game.id}>
                  <td>
                    <span
                      className="has-text-link has-text-weight-semibold"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleGameClick(game)}
                    >
                      {game.title}
                    </span>
                  </td>
                  <td>{game.condition}</td>
                  <td>${game.estimated_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default GamesList;
