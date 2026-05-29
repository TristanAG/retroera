// components/Game.jsx
import { useState, useEffect } from "react";
import { igdbImageUrl } from "../igdbService";

const Game = ({ igdbId, onBack }) => {
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

  useEffect(() => {
    setLightboxIndex(null);
  }, [igdbId]);

  const screenshots =
    game?.screenshots
      ?.map((s, i) => ({
        thumb: igdbImageUrl(s, "screenshot_med"),
        full: igdbImageUrl(s, "1080p"),
        alt: `${game.name} screenshot ${i + 1}`,
      }))
      .filter((s) => s.thumb && s.full) ?? [];

  useEffect(() => {
    if (lightboxIndex === null || screenshots.length === 0) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i + 1) % screenshots.length);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, screenshots.length]);

  const goToPrev = () => {
    setLightboxIndex((i) => (i - 1 + screenshots.length) % screenshots.length);
  };

  const goToNext = () => {
    setLightboxIndex((i) => (i + 1) % screenshots.length);
  };

  if (loading) return <p>Loading game...</p>;
  if (error) return <p>{error}</p>;

  const coverSrc = igdbImageUrl(game.cover, "1080p");

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <button className="button is-small" onClick={onBack}>← Back</button>

      <h2 className="title">{game.name}</h2>
      <p><strong>Console:</strong> {game.platforms?.map(p => p.name).join(", ")}</p>
      <p><strong>Developer:</strong> {game.involved_companies?.map(c => c.company.name).join(", ")}</p>
      <p><strong>Release Year:</strong> {game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : "Unknown"}</p>
      <p><strong>Description:</strong> {game.summary || "No description available."}</p>

      {coverSrc && (
        <img
          src={coverSrc}
          alt={game.name}
          style={{ width: "100%", maxWidth: "600px", marginTop: "1rem", borderRadius: "4px" }}
        />
      )}
      {screenshots.length > 0 && (
        <div className="screenshot-thumbnails">
          {screenshots.map((s, i) => (
            <button
              key={i}
              type="button"
              className="screenshot-thumbnail"
              onClick={() => setLightboxIndex(i)}
              aria-label={`View screenshot ${i + 1}`}
            >
              <img src={s.thumb} alt={s.alt} />
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          className="screenshot-lightbox"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot viewer"
        >
          <button
            type="button"
            className="screenshot-lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            ×
          </button>

          {screenshots.length > 1 && (
            <button
              type="button"
              className="screenshot-lightbox__nav screenshot-lightbox__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Previous screenshot"
            >
              ‹
            </button>
          )}

          <img
            className="screenshot-lightbox__image"
            src={screenshots[lightboxIndex].full}
            alt={screenshots[lightboxIndex].alt}
            onClick={(e) => e.stopPropagation()}
          />

          {screenshots.length > 1 && (
            <button
              type="button"
              className="screenshot-lightbox__nav screenshot-lightbox__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next screenshot"
            >
              ›
            </button>
          )}

          <span className="screenshot-lightbox__counter">
            {lightboxIndex + 1} / {screenshots.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default Game;
