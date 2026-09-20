"use client";

import { useEffect, useMemo, useState } from "react";
import StorageImage from "./StorageImage";

const PAGE_SIZE = 10;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const GamesList = ({ games, onSelectGame, onEditGame, onDeleteGame }) => {
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);

  const consoles = useMemo(
    () => [...new Set(games.map((game) => game.console))].sort(),
    [games]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [selectedConsole]);

  useEffect(() => {
    if (selectedConsole && !consoles.includes(selectedConsole)) {
      setSelectedConsole(null);
    }
  }, [consoles, selectedConsole]);

  const selectedConsoleGames =
    selectedConsole === null
      ? games
      : games.filter((game) => game.console === selectedConsole);
  const activeGames = selectedConsoleGames;

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
          igdbPlatformId: game.igdb_platform_id,
          title: game.title,
          console: game.console,
        });
      }}
      style={{
        cursor: game.igdb_id ? "pointer" : "not-allowed",
        opacity: game.igdb_id ? 1 : 0.6,
      }}
    >
      <td>
        <span className="games-list__title">
          {game.photoPaths?.[0] && (
            <StorageImage
              path={game.photoPaths[0]}
              alt=""
              className="games-list__thumbnail"
            />
          )}
          {game.title}
        </span>
      </td>
      <td>{game.console}</td>
      <td>{game.condition}</td>
      <td className="has-text-success-65 has-text-weight-semibold">${game.estimated_value}</td>
      <td className="games-list__actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="button is-small"
          onClick={() => onEditGame?.(game)}
        >
          edit
        </button>
        <button
          type="button"
          className="button is-danger is-small"
          onClick={() => onDeleteGame?.(game)}
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
