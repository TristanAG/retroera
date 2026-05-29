import { useEffect, useState } from "react";
import {
  CONSOLE_OPTIONS,
  CONSOLE_TO_IGDB_PLATFORM,
  DEFAULT_EXPLORE_REGION_IDS,
  EXPLORE_REGIONS,
  fetchGamesByPlatform,
  PAGE_SIZE,
} from "../igdbService";

function Explore({ onSelectGame }) {
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [selectedRegionIds, setSelectedRegionIds] = useState(DEFAULT_EXPLORE_REGION_IDS);
  const [pageIndex, setPageIndex] = useState(0);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedConsole) return;

    const platformId = CONSOLE_TO_IGDB_PLATFORM[selectedConsole];
    if (!platformId) return;

    let cancelled = false;

    async function loadGames() {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchGamesByPlatform(platformId, {
          limit: PAGE_SIZE,
          offset: pageIndex * PAGE_SIZE,
          regionIds: selectedRegionIds,
        });
        if (!cancelled) setGames(results);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setGames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGames();
    return () => {
      cancelled = true;
    };
  }, [selectedConsole, pageIndex, selectedRegionIds]);

  const toggleRegion = (regionId) => {
    setSelectedRegionIds((prev) => {
      if (prev.includes(regionId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== regionId);
      }
      return [...prev, regionId].sort((a, b) => a - b);
    });
  };

  const hasNextPage = games.length === PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;

  const handleConsoleClick = (consoleName) => {
    setSelectedConsole(consoleName);
    setPageIndex(0);
    setGames([]);
    setError(null);
  };

  const handleBack = () => {
    setSelectedConsole(null);
    setPageIndex(0);
    setGames([]);
    setError(null);
  };

  if (!selectedConsole) {
    return (
      <div className="explore" style={{ padding: "20px", maxWidth: "960px", margin: "0 auto" }}>
        <h2 className="title is-4 mb-2">Explore by Console</h2>
        <p className="subtitle is-6 has-text-grey mb-4">
          Pick a platform to browse games from IGDB.
        </p>

        <fieldset className="explore-region-filters mb-5">
          <legend className="label mb-2">Region</legend>
          <div className="explore-region-filters__options">
            {EXPLORE_REGIONS.map(({ id, label }) => (
              <label key={id} className="explore-region-filters__option">
                <input
                  type="checkbox"
                  checked={selectedRegionIds.includes(id)}
                  onChange={() => toggleRegion(id)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <ul className="explore-console-grid">
          {CONSOLE_OPTIONS.map((consoleName) => (
            <li key={consoleName}>
              <button
                type="button"
                className="explore-console-card"
                onClick={() => handleConsoleClick(consoleName)}
              >
                {consoleName}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="is-flex is-align-items-center mb-4" style={{ gap: "12px" }}>
        <button type="button" className="button is-small" onClick={handleBack}>
          Back
        </button>
        <h2 className="title is-4 mb-0">{selectedConsole}</h2>
      </div>

      {loading && <p>Loading games…</p>}
      {error && <p>Error: {error}</p>}

      {!loading && !error && (
        <>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {games.map((game) => (
              <li
                key={game.id}
                onClick={() =>
                  onSelectGame({
                    igdbId: game.id,
                    title: game.name,
                    console: selectedConsole,
                  })
                }
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #dbdbdb",
                  cursor: "pointer",
                }}
              >
                {game.coverUrl ? (
                  <img
                    src={game.coverUrl}
                    alt={game.name}
                    width={64}
                    height={64}
                    style={{ borderRadius: "6px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "6px",
                      background: "#eee",
                    }}
                  />
                )}
                <div>
                  <h3 className="title is-5 mb-1">{game.name}</h3>
                  {game.releaseYear && (
                    <p className="has-text-grey">{game.releaseYear}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {games.length === 0 && <p>No games found for this console.</p>}

          <div className="is-flex is-align-items-center mt-4" style={{ gap: "12px" }}>
            <button
              type="button"
              className="button is-small"
              disabled={!hasPrevPage}
              onClick={() => setPageIndex((p) => p - 1)}
            >
              Previous
            </button>
            <span>Page {pageIndex + 1}</span>
            <button
              type="button"
              className="button is-small"
              disabled={!hasNextPage}
              onClick={() => setPageIndex((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Explore;
