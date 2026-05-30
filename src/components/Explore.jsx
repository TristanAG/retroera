import { useEffect, useState } from "react";
import {
  CONSOLE_OPTIONS,
  CONSOLE_TO_IGDB_PLATFORM,
  DEFAULT_EXPLORE_REGION_IDS,
  EXPLORE_REGIONS,
  fetchGamesByPlatform,
  PAGE_SIZE,
  searchGamesByPlatform,
} from "../igdbService";

const ALPHA_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SEARCH_DEBOUNCE_MS = 300;

function Explore({ onSelectGame }) {
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [selectedRegionIds, setSelectedRegionIds] = useState(DEFAULT_EXPLORE_REGION_IDS);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isSearchMode = debouncedSearch.length >= 3;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!selectedConsole) return;

    const platformId = CONSOLE_TO_IGDB_PLATFORM[selectedConsole];
    if (!platformId) return;

    let cancelled = false;

    async function loadGames() {
      setLoading(true);
      setError(null);
      try {
        const results = isSearchMode
          ? await searchGamesByPlatform(debouncedSearch, platformId)
          : await fetchGamesByPlatform(platformId, {
              limit: PAGE_SIZE,
              offset: pageIndex * PAGE_SIZE,
              regionIds: selectedRegionIds,
              namePrefix: selectedLetter,
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
  }, [
    selectedConsole,
    pageIndex,
    selectedRegionIds,
    debouncedSearch,
    selectedLetter,
    isSearchMode,
  ]);

  const toggleRegion = (regionId) => {
    setSelectedRegionIds((prev) => {
      if (prev.includes(regionId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== regionId);
      }
      return [...prev, regionId].sort((a, b) => a - b);
    });
  };

  const hasNextPage = !isSearchMode && games.length === PAGE_SIZE;
  const hasPrevPage = !isSearchMode && pageIndex > 0;

  const paginationBar = (
    <div className="is-flex is-align-items-center explore-pagination" style={{ gap: "12px" }}>
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
  );

  const resetConsoleView = () => {
    setPageIndex(0);
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedLetter(null);
    setGames([]);
    setError(null);
  };

  const handleConsoleClick = (consoleName) => {
    setSelectedConsole(consoleName);
    resetConsoleView();
  };

  const handleBack = () => {
    setSelectedConsole(null);
    resetConsoleView();
  };

  const handleLetterClick = (letter) => {
    setPageIndex(0);
    setSelectedLetter((prev) => (prev === letter ? null : letter));
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const renderGameList = () => (
    <ul className="explore-game-list">
      {games.map((game) => (
        <li
          key={game.id}
          className="explore-game-list__item"
          onClick={() =>
            onSelectGame({
              igdbId: game.id,
              title: game.name,
              console: selectedConsole,
            })
          }
        >
          {game.coverUrl ? (
            <img
              src={game.coverUrl}
              alt={game.name}
              width={64}
              height={64}
              className="explore-game-list__cover"
            />
          ) : (
            <div className="explore-game-list__cover explore-game-list__cover--placeholder" />
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
  );

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

  const showAlphaBar = !isSearchMode && searchQuery.trim().length === 0;
  const emptyMessage = isSearchMode
    ? "No games match your search on this console."
    : selectedLetter
      ? `No games starting with "${selectedLetter}" for this console.`
      : "No games found for this console.";

  return (
    <div className="explore explore-console-view" style={{ padding: "20px", maxWidth: "960px", margin: "0 auto" }}>
      <div className="is-flex is-align-items-center mb-4" style={{ gap: "12px" }}>
        <button type="button" className="button is-small" onClick={handleBack}>
          Back
        </button>
        <h2 className="title is-4 mb-0">{selectedConsole}</h2>
      </div>

      <div className={`explore-search mb-4 ${loading && isSearchMode ? "is-loading" : ""}`}>
        <input
          type="text"
          className="input explore-search__input"
          placeholder={`Search ${selectedConsole} games…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="explore-search__clear"
            aria-label="Clear search"
            onClick={handleClearSearch}
          >
            ×
          </button>
        )}
      </div>

      {showAlphaBar && (
        <div className="explore-alpha-bar mb-4">
          <button
            type="button"
            className={`explore-alpha-bar__btn ${selectedLetter === null ? "is-active" : ""}`}
            onClick={() => setSelectedLetter(null)}
          >
            All
          </button>
          {ALPHA_LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              className={`explore-alpha-bar__btn ${selectedLetter === letter ? "is-active" : ""}`}
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
            </button>
          ))}
          <button
            type="button"
            className={`explore-alpha-bar__btn ${selectedLetter === "#" ? "is-active" : ""}`}
            onClick={() => handleLetterClick("#")}
          >
            #
          </button>
        </div>
      )}

      {loading && <p>Loading games…</p>}
      {error && <p>Error: {error}</p>}

      {!loading && !error && (
        <>
          {isSearchMode && games.length > 0 && (
            <p className="has-text-grey mb-4">
              {games.length} result{games.length === 1 ? "" : "s"}
            </p>
          )}

          {!isSearchMode && (games.length > 0 || hasPrevPage) && (
            <div className="mb-4">{paginationBar}</div>
          )}

          {games.length > 0 && renderGameList()}

          {games.length === 0 && <p>{emptyMessage}</p>}

          {!isSearchMode && (games.length > 0 || hasPrevPage) && (
            <div className="mt-4">{paginationBar}</div>
          )}
        </>
      )}
    </div>
  );
}

export default Explore;
