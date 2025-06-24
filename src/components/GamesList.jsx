import { useEffect, useState } from "react";
import { subscribeToConsoles, getGamesByConsole } from "../firestoreService"; // 🔄 CHANGED: import subscribeToConsoles

const GamesList = ({ games }) => {
  const [consoles, setConsoles] = useState([]);
  const [selectedConsoleGames, setSelectedConsoleGames] = useState([]);

  // 🔥 SUBSCRIBE to consoles in real-time on mount
  useEffect(() => {
    const unsubscribe = subscribeToConsoles(setConsoles); // 🔄 CHANGED LINE

    return () => unsubscribe(); // 🔄 CHANGED LINE
  }, []);

  const handleSelectConsole = async (consoleName) => {
    try {
      const games = await getGamesByConsole(consoleName);
      setSelectedConsoleGames(games);
    } catch (error) {
      console.error("Error fetching games by console:", error.message);
    }
  };

  return (
    <div>
      <h3>Your Games:</h3>
      <ul>
        {games.map((game) => (
          <li key={game.id}>
            {game.title} - {game.console} ({game.condition}) - ${game.estimated_value}
          </li>
        ))}
      </ul>

      <h3>Your Consoles:</h3>
      <ul>
        {consoles.map((consoleName) => (
          <li key={consoleName}>
            <button className="button is-small" onClick={() => handleSelectConsole(consoleName)}>
              {consoleName}
            </button>
          </li>
        ))}
      </ul>

      {selectedConsoleGames.length > 0 && (
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
