import { useEffect, useState } from "react";
import { subscribeToConsoles, subscribeToGamesByConsole } from "../firestoreService";

const GamesList = ({ games, onSelectGame }) => {
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
    const unsubscribe = subscribeToGamesByConsole(selectedConsole, setSelectedConsoleGames);
    return () => unsubscribe();
  }, [selectedConsole]);

  const totalValueAllGames = games.reduce((sum, game) => sum + (parseFloat(game.estimated_value) || 0), 0);
  const totalValueSelectedConsole = selectedConsoleGames.reduce(
    (sum, game) => sum + (parseFloat(game.estimated_value) || 0),
    0
  );

  // Helper: Render game row
  const renderGameRow = (game) => (
    <tr
      key={game.id}
      onClick={() => {
        console.log("Clicked game:", game);       // <- logs entire object
        console.log("IGDB ID:", game.igdb_id);    // <- logs the ID
        if (!game.igdb_id || !game.igdb_id.trim()) {
          alert(`IGDB ID not available for "${game.title}". Please backfill the ID.`);
          return;
        }
        onSelectGame(game.igdb_id.trim());
      }}

      style={{
        cursor: game.igdb_id ? "pointer" : "not-allowed",
        opacity: game.igdb_id ? 1 : 0.6
      }}
    >
      <td>{game.title}</td>
      <td>{game.condition}</td>
      <td className="has-text-success-65 has-text-weight-semibold">${game.estimated_value}</td>
    </tr>
  );

  return (
    <div style={{ margin: "0 auto" }}>
      <ul className="user-console-list">
        <li>
          <span 
            className={`tag is-size-6 ${selectedConsole === null ? "has-background-link-90" : "is-light"}`}
            onClick={() => setSelectedConsole(null)}
            style={{ cursor: "pointer" }}
          >
            All Games
          </span>
        </li>
        {consoles.map((consoleName) => (
          <li key={consoleName} className={consoleName.split(' ').join('-').toLowerCase()}>
            <span 
              className={`tag is-size-6 ${selectedConsole === consoleName ? "has-background-link-90" : "is-light"}`}
              onClick={() => setSelectedConsole(consoleName)}
              style={{ cursor: "pointer" }}
            >
              {consoleName}
            </span>
          </li>
        ))}
      </ul>

      <input className="input is-info" type="text" placeholder="Info input" />

      {selectedConsole === null ? (
        <>
          <p><strong>Total Value:</strong> ${totalValueAllGames.toFixed(2)}</p>
          <table className="table is-striped is-fullwidth">
            <thead>
              <tr>
                <th>Game</th>
                <th>Condition</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {games.map(renderGameRow)}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h4 className="is-size-3">{selectedConsole}</h4>
          <p className="is-size-6">
            Total Value: <span className="has-text-success-65 has-text-weight-semibold">${totalValueSelectedConsole.toFixed(2)}</span>
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
              {selectedConsoleGames.map(renderGameRow)}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default GamesList;
