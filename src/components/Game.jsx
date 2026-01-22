// components/Game.jsx
import { useState, useEffect } from "react";

const Game = ({ igdbId, onBack }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!igdbId) return;

    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:4000/api/igdb/game/${igdbId}`);
        if (!res.ok) throw new Error("Failed to fetch game data");

        const data = await res.json();
        setGame(data);
      } catch (err) {
        console.error(err);
        setError("Could not load game data");
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [igdbId]);

  if (loading) return <p>Loading game...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <button className="button is-small" onClick={onBack}>← Back</button>

      <h2 className="title">{game.name}</h2>
      <p><strong>Console:</strong> {game.platforms?.map(p => p.name).join(", ")}</p>
      <p><strong>Developer:</strong> {game.involved_companies?.map(c => c.company.name).join(", ")}</p>
      <p><strong>Release Year:</strong> {game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : "Unknown"}</p>
      <p><strong>Description:</strong> {game.summary || "No description available."}</p>

      {game.cover && <img src={`https:${game.cover.url}`} alt={game.name} style={{ maxWidth: "300px", marginTop: "1rem" }} />}
      {game.screenshots && game.screenshots.length > 0 && (
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", overflowX: "auto" }}>
          {game.screenshots.map((s, i) => (
            <img key={i} src={`https:${s.url}`} alt={`${game.name} screenshot ${i+1}`} style={{ maxHeight: "200px" }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Game;
