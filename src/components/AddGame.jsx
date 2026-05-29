import { useEffect, useState } from "react";
import { CONSOLE_OPTIONS, searchGamesByTitle } from "../igdbService";
import { CONDITION_PRICE_HINTS } from "../priceChartingService";
import PriceChartingLink from "./PriceChartingLink";

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

  useEffect(() => {
    if (!consoleName || gameTitle.trim().length < 3) {
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
        const results = await searchGamesByTitle(searchTerm, consoleName);
        if (cancelled) return;
        setSuggestions(results);
        setHasSearched(true);
        setShowDropdown(true);
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setSearchError("Unable to search IGDB. Is the server running?");
        setHasSearched(true);
        setShowDropdown(true);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [gameTitle, consoleName]);

  const handleTitleChange = (e) => {
    setGameTitle(e.target.value);
    setIgdbId("");
    setShowIgdbError(false);
  };

  const handleConsoleChange = (e) => {
    setConsoleName(e.target.value);
    setIgdbId("");
    setShowIgdbError(false);
    setSuggestions([]);
    setShowDropdown(false);
    setHasSearched(false);
  };

  const handleSelectSuggestion = (suggestion) => {
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
        <label className="label">Game Title</label>
        <div className={`dropdown is-fullwidth ${showDropdown ? "is-active" : ""}`}>
          <div className="dropdown-trigger is-fullwidth">
            <div className={`control is-fullwidth ${isSearching ? "is-loading" : ""}`}>
              <input
                type="text"
                placeholder="Search IGDB by game title"
                value={gameTitle}
                className="input"
                disabled={!consoleName}
                onChange={handleTitleChange}
                onFocus={() => {
                  if (suggestions.length > 0 || showNoResults || searchError) {
                    setShowDropdown(true);
                  }
                }}
              />
            </div>
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
                {suggestions.map((suggestion) => (
                  <a
                    key={suggestion.id}
                    className="dropdown-item"
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
                    <span>{suggestion.name}</span>
                    {suggestion.releaseYear && (
                      <span className="tag is-light is-size-7 ml-2">
                        {suggestion.releaseYear}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
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
