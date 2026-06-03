import { useEffect, useState } from "react";
import { subscribeToConsoles, subscribeToGamesByConsole } from "../firestoreService";

const PAGE_SIZE = 10;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const GamesList = ({ games, onSelectGame, onEditGame, onDeleteGame }) => {
  const [consoles, setConsoles] = useState([]);
  const [selectedConsoleGames, setSelectedConsoleGames] = useState([]);
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);

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

  useEffect(() => {
    setPageIndex(0);
  }, [selectedConsole]);

  const activeGames = selectedConsole === null ? games : selectedConsoleGames;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(activeGames.length / PAGE_SIZE) - 1);
    setPageIndex((p) => (p > maxPage ? maxPage : p));
  }, [activeGames.length]);

  const parseValue = (game) => parseFloat(game.estimated_value) || 0;
  const sortByValueDesc = (gameList) =>
    [...gameList].sort((a, b) => parseValue(b) - parseValue(a));

  const sortedGames = sortByValueDesc(activeGames);
  const totalPages = Math.max(1, Math.ceil(sortedGames.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const paginatedGames = sortedGames.slice(
    safePageIndex * PAGE_SIZE,
    safePageIndex * PAGE_SIZE + PAGE_SIZE
  );
  const hasPrevPage = safePageIndex > 0;
  const hasNextPage = (safePageIndex + 1) * PAGE_SIZE < sortedGames.length;
  const showPagination = sortedGames.length > PAGE_SIZE || hasPrevPage;

  const totalValueAllGames = games.reduce((sum, game) => sum + parseValue(game), 0);
  const totalValueSelectedConsole = selectedConsoleGames.reduce(
    (sum, game) => sum + parseValue(game),
    0
  );

  const paginationBar = showPagination && (
    <div className="is-flex is-align-items-center" style={{ gap: "12px" }}>
      <button
        type="button"
        className="button is-small"
        disabled={!hasPrevPage}
        onClick={() => setPageIndex((p) => p - 1)}
      >
        Previous
      </button>
      <span>
        Page {safePageIndex + 1} of {totalPages}
      </span>
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

  const renderTotalValue = (total, inline = false) => (
    <h3 className={`is-size-4 ${inline ? "mb-0" : "has-text-right mb-4"}`}>
      <strong>Total Value:</strong>{" "}
      <span className="has-text-success-65 has-text-weight-semibold">{formatMoney(total)}</span>
    </h3>
  );

  const getCanonicalGame = (game) =>
    games.find(
      (g) =>
        String(g.igdb_id).trim() === String(game.igdb_id).trim() &&
        g.console === game.console
    ) ?? game;

  // Helper: Render game row
  const renderGameRow = (game) => (
    <tr
      key={game.id}
      onClick={() => {
        if (!game.igdb_id || !game.igdb_id.trim()) {
          alert(`IGDB ID not available for "${game.title}". Please backfill the ID.`);
          return;
        }
        onSelectGame({
          igdbId: game.igdb_id.trim(),
          title: game.title,
          console: game.console,
        });
      }}
      style={{
        cursor: game.igdb_id ? "pointer" : "not-allowed",
        opacity: game.igdb_id ? 1 : 0.6,
      }}
    >
      <td>{game.title}</td>
      <td>{game.console}</td>
      <td>{game.condition}</td>
      <td className="has-text-success-65 has-text-weight-semibold">${game.estimated_value}</td>
      <td className="games-list__actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="button is-small"
          onClick={() => onEditGame?.(getCanonicalGame(game))}
        >
          edit
        </button>
        <button
          type="button"
          className="button is-danger is-small"
          onClick={() => onDeleteGame?.(getCanonicalGame(game))}
        >
          delete
        </button>
      </td>
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

      {/* <input className="input is-info" type="text" placeholder="Info input" /> */}

      {selectedConsole === null ? (
        renderTotalValue(totalValueAllGames)
      ) : (
        <div className="is-flex is-align-items-baseline is-justify-content-space-between mb-4">
          <h4 className="is-size-3 mb-0">{selectedConsole}</h4>
          {renderTotalValue(totalValueSelectedConsole, true)}
        </div>
      )}

      {sortedGames.length === 0 ? (
        <p className="has-text-grey">No games in this view.</p>
      ) : (
        <>
          {paginationBar && <div className="mb-4">{paginationBar}</div>}
          <table className="table is-striped is-fullwidth">
            <thead>
              <tr>
                <th>Game</th>
                <th>Console</th>
                <th>Condition</th>
                <th>Value</th>
                <th className="games-list__actions">Actions</th>
              </tr>
            </thead>
            <tbody>{paginatedGames.map(renderGameRow)}</tbody>
          </table>
          {paginationBar && <div className="mt-4">{paginationBar}</div>}
        </>
      )}
    </div>
  );
};

export default GamesList;
