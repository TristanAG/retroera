import { useEffect, useRef, useState } from "react";
import { CONSOLE_OPTIONS, CONSOLE_TO_IGDB_PLATFORM, searchGamesByPlatform } from "../igdbService";
import { CONDITION_PRICE_HINTS } from "../priceChartingService";
import PriceChartingLink from "./PriceChartingLink";

const SEARCH_DEBOUNCE_MS = 300;
const ADD_GAME_SUGGESTION_LIMIT = 8;

function AddGame({
  gameTitle,
  setGameTitle,
  consoleName,
  setConsoleName,
  condition,
  setCondition,
  estimatedValue,
  setEstimatedValue,
  igdbId,
  setIgdbId,
  handleAddGame,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showIgdbError, setShowIgdbError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const suppressDropdownRef = useRef(false);

  useEffect(() => {
    if (igdbId) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const platformId = CONSOLE_TO_IGDB_PLATFORM[consoleName];
    if (!platformId || gameTitle.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      setHasSearched(false);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const searchTerm = gameTitle.trim();

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const results = await searchGamesByPlatform(searchTerm, platformId, {
          limit: ADD_GAME_SUGGESTION_LIMIT,
        });
        if (cancelled) return;
        setSuggestions(results);
        setHasSearched(true);
        if (!suppressDropdownRef.current) {
          setShowDropdown(true);
        }
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setSearchError("Unable to search IGDB. Is the server running?");
        setHasSearched(true);
        if (!suppressDropdownRef.current) {
          setShowDropdown(true);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [gameTitle, consoleName, igdbId]);

  const handleTitleChange = (e) => {
    suppressDropdownRef.current = false;
    setGameTitle(e.target.value);
    setIgdbId("");
    setShowIgdbError(false);
  };

  const handleConsoleChange = (e) => {
    suppressDropdownRef.current = false;
    setConsoleName(e.target.value);
    setIgdbId("");
    setShowIgdbError(false);
    setSuggestions([]);
    setShowDropdown(false);
    setHasSearched(false);
  };

  const handleSelectSuggestion = (suggestion) => {
    suppressDropdownRef.current = true;
    setGameTitle(suggestion.name);
    setIgdbId(suggestion.id);
    setShowDropdown(false);
    setShowIgdbError(false);
    setHasSearched(false);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    if (!igdbId) {
      setShowIgdbError(true);
      return;
    }
    handleAddGame();
  };

  const showConsoleHint = !consoleName;
  const showNoResults =
    showDropdown && hasSearched && !isSearching && suggestions.length === 0 && !searchError;
  const showPriceChartingLink = gameTitle.trim().length >= 3;

  return (
    <div className="add-form">
      <div className="field">
        <div className="control">
          <label className="label">Console</label>
          <select
            value={consoleName}
            onChange={handleConsoleChange}
            className="input"
          >
            <option value="">Select Console</option>
            {CONSOLE_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {showConsoleHint && (
          <p className="help is-info">Select a console first to search IGDB.</p>
        )}
      </div>

      <div className="field">
        <div className={`control ${isSearching ? "is-loading" : ""}`}>
          <label className="label">Game Title</label>
          <div className={`dropdown is-fullwidth ${showDropdown ? "is-active" : ""}`}>
            <div className="dropdown-trigger is-fullwidth">
              <input
                type="text"
                placeholder="Search IGDB by game title"
                value={gameTitle}
                className="input"
                disabled={!consoleName}
                onChange={handleTitleChange}
                onFocus={() => {
                  if (igdbId || suppressDropdownRef.current) return;
                  if (suggestions.length > 0 || showNoResults || searchError) {
                    setShowDropdown(true);
                  }
                }}
              />
            </div>
            {showDropdown && (suggestions.length > 0 || showNoResults || searchError) && (
              <div className="dropdown-menu is-fullwidth" role="menu">
                <div className="dropdown-content add-form-dropdown">
                  {searchError && (
                    <div className="dropdown-item has-text-danger">{searchError}</div>
                  )}
                  {showNoResults && (
                    <div className="dropdown-item has-text-grey">No IGDB matches found</div>
                  )}
                  {suggestions.length > 0 && (
                    <ul className="explore-game-list add-form-suggestions">
                      {suggestions.map((suggestion) => (
                        <li
                          key={suggestion.id}
                          className="explore-game-list__item"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectSuggestion(suggestion);
                            }
                          }}
                        >
                          {suggestion.coverUrl ? (
                            <img
                              src={suggestion.coverUrl}
                              alt={suggestion.name}
                              width={64}
                              height={64}
                              className="explore-game-list__cover"
                            />
                          ) : (
                            <div className="explore-game-list__cover explore-game-list__cover--placeholder" />
                          )}
                          <div>
                            <h3 className="title is-5 mb-1">{suggestion.name}</h3>
                            {suggestion.releaseYear && (
                              <p className="has-text-grey">{suggestion.releaseYear}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {igdbId && <p className="help is-success">IGDB match selected.</p>}
        {showIgdbError && (
          <p className="help is-danger">
            Select a game from IGDB suggestions to continue.
          </p>
        )}
      </div>

      <div className="field">
        <div className="control">
          <label className="label">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="input"
          >
            <option value="CIB">CIB (Complete in Box)</option>
            <option value="Disc Only">Disc Only</option>
            <option value="New">New</option>
          </select>
        </div>
      </div>

      <div className="field">
        <div className="control">
          <label className="label">Estimated Value</label>
          <input
            type="number"
            placeholder="Estimated Value"
            value={estimatedValue}
            className="input"
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </div>
        {showPriceChartingLink && (
          <PriceChartingLink title={gameTitle} className="mt-2" />
        )}
        {showPriceChartingLink && CONDITION_PRICE_HINTS[condition] && (
          <p className="help">
            For {condition}: look for the {CONDITION_PRICE_HINTS[condition]} column.
          </p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="button is-primary"
        disabled={!igdbId}
      >
        Add Game
      </button>
    </div>
  );
}

export default AddGame;
