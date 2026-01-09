import { useEffect, useState } from "react";

export default function DreamcastGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        const query = `
          fields
            name,
            cover.image_id,
            first_release_date;
          where platforms = 23;
          sort first_release_date desc;
          limit 20;
        `;

        const res = await fetch("http://localhost:4000/api/igdb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch IGDB data");
        }

        const data = await res.json();
        setGames(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  if (loading) return <p>Loading Dreamcast games…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section>
      <h2>Dreamcast Games</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {games.map((game) => (
          <li key={game.id} style={{ marginBottom: "24px" }}>
            <h3>{game.name}</h3>

            {game.cover?.image_id && (
              <img
                src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`}
                alt={game.name}
                style={{ borderRadius: "6px" }}
              />
            )}

            {game.first_release_date && (
              <p>
                Released{" "}
                {new Date(
                  game.first_release_date * 1000
                ).toLocaleDateString()}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
