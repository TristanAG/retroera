// components/Game.jsx
import { useState, useEffect } from "react";
import { igdbImageUrl } from "../igdbService";
import PriceChartingLink from "./PriceChartingLink";

const Game = ({
  igdbId,
  title,
  isInCollection,
  onAddToCollection,
  onBack,
}) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (!igdbId) return;

    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/igdb/game/${igdbId}`);
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

  useEffect(() => {
    setLightboxIndex(null);
  }, [igdbId]);

  const screenshotItems =
    game?.screenshots
      ?.map((s, i) => ({
        thumb: igdbImageUrl(s, "screenshot_med"),
        full: igdbImageUrl(s, "1080p"),
        alt: `${game.name} screenshot ${i + 1}`,
      }))
      .filter((s) => s.thumb && s.full) ?? [];

  const coverFull = game?.cover ? igdbImageUrl(game.cover, "1080p") : null;

  const gallery = [
    ...(coverFull
      ? [{ full: coverFull, alt: `${game?.name ?? ""} cover` }]
      : []),
    ...screenshotItems,
  ];

  const coverIndex = coverFull ? 0 : null;
  const screenshotThumbOffset = coverFull ? 1 : 0;

  useEffect(() => {
    if (lightboxIndex === null || gallery.length === 0) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i - 1 + gallery.length) % gallery.length);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i + 1) % gallery.length);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, gallery.length]);

  const goToPrev = () => {
    setLightboxIndex((i) => (i - 1 + gallery.length) % gallery.length);
  };

  const goToNext = () => {
    setLightboxIndex((i) => (i + 1) % gallery.length);
  };

  if (loading) return <p>Loading game...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="game-page">
      <div className="game-page__header">
        <button className="button is-small" onClick={onBack}>← Back</button>
        {!isInCollection && onAddToCollection && (
          <button
            type="button"
            className="button is-primary is-small"
            onClick={onAddToCollection}
          >
            + add game
          </button>
        )}
      </div>

      <div className={`game-layout${coverFull ? "" : " game-layout--content-only"}`}>
        {coverFull && (
          <div className="game-layout__media">
            <button
              type="button"
              className="game-cover-btn"
              onClick={() => setLightboxIndex(coverIndex)}
              aria-label={`View ${game.name} cover art`}
            >
              <img className="game-cover" src={coverFull} alt={game.name} />
            </button>
          </div>
        )}

        <div className="game-layout__content">
          <h2 className="title">{game.name}</h2>
          <PriceChartingLink title={title ?? game.name} className="mb-4" />
          <p><strong>Console:</strong> {game.platforms?.map(p => p.name).join(", ")}</p>
          <p><strong>Developer:</strong> {game.involved_companies?.map(c => c.company.name).join(", ")}</p>
          <p><strong>Release Year:</strong> {game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : "Unknown"}</p>
          <p><strong>Description:</strong> {game.summary || "No description available."}</p>

          {screenshotItems.length > 0 && (
            <div className="screenshot-thumbnails">
              {screenshotItems.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="screenshot-thumbnail"
                  onClick={() => setLightboxIndex(screenshotThumbOffset + i)}
                  aria-label={`View screenshot ${i + 1}`}
                >
                  <img src={s.thumb} alt={s.alt} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div
          className="screenshot-lightbox"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            className="screenshot-lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            ×
          </button>

          {gallery.length > 1 && (
            <button
              type="button"
              className="screenshot-lightbox__nav screenshot-lightbox__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <img
            className="screenshot-lightbox__image"
            src={gallery[lightboxIndex].full}
            alt={gallery[lightboxIndex].alt}
            onClick={(e) => e.stopPropagation()}
          />

          {gallery.length > 1 && (
            <button
              type="button"
              className="screenshot-lightbox__nav screenshot-lightbox__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              ›
            </button>
          )}

          <span className="screenshot-lightbox__counter">
            {lightboxIndex + 1} / {gallery.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default Game;
