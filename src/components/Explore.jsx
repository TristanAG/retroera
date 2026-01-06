import { useEffect, useState } from "react";

function Explore() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const res = await fetch(
          "/rawg/api/games?platforms=43&page_size=5"
        );
        if (!res.ok) throw new Error("Failed to fetch games");
        const data = await res.json();
        setGames(data.results || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  if (loading) return <p>Loading Game Boy games...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Top 5 Game Boy Games</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {games.map((game) => (
          <li
            key={game.id}
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "10px",
            }}
          >
            <h3>{game.name}</h3>
            {game.background_image && (
              <img
                src={game.background_image}
                alt={game.name}
                width="200"
                style={{ borderRadius: "8px" }}
              />
            )}
            <p>Released: {game.released || "Unknown"}</p>
            <p>Rating: {game.rating || "N/A"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Explore;
