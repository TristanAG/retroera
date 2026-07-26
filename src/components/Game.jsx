// components/Game.jsx
import { useState, useEffect } from "react";
import { igdbImageUrl } from "../igdbService";
import PriceChartingLink from "./PriceChartingLink";
import CommunityCopiesRail from "./CommunityCopiesRail";
import StorageImage from "./StorageImage";

const Game = ({
  igdbId,
  igdbPlatformId,
  consoleName,
  title,
  isInCollection,
  ownedCopies = [],
  currentUserId,
  onAddToCollection,
  onEditGame,
  onDeleteGame,
  onSelectCommunityCopy,
  onBack,
}) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeCopyPhotoPath, setActiveCopyPhotoPath] = useState(null);

  const copyPhotoEntries = ownedCopies.flatMap((copy, copyIndex) =>
    (copy.photoPaths ?? []).map((path, photoIndex) => ({
      path,
      alt: `${copy.title} copy ${copyIndex + 1} photo ${photoIndex + 1}`,
    }))
  );

  useEffect(() => {
    if (!igdbId) return;

    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/igdb/game/${igdbId}`);
        const text = await res.text();
        let data = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("Invalid response from IGDB server");
          }
        }

        if (!res.ok) {
          throw new Error(
            data?.error ||
              (text
                ? "Failed to fetch game data"
                : "Failed to fetch game data. Is the IGDB server running? (cd server && npm start)")
          );
        }

        setGame(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load game data");
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [igdbId]);

  useEffect(() => {
    setLightboxIndex(null);
    setActiveCopyPhotoPath(null);
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
        <div className="game-page__actions">
          {onAddToCollection && (
            <button
              type="button"
              className="button is-primary is-small"
              onClick={onAddToCollection}
            >
              {isInCollection ? "+ add another copy" : "+ add copy"}
            </button>
          )}
        </div>
      </div>

      <div className="game-page__body">
        <div className="game-page__intro">
          <h2 className="title game-page__title">{game.name}</h2>
          <PriceChartingLink title={title ?? game.name} />
        </div>

        <div className={`game-layout${coverFull || screenshotItems.length > 0 ? "" : " game-layout--content-only"}`}>
          {(coverFull || screenshotItems.length > 0) && (
            <div className="game-layout__media">
              {coverFull && (
                <button
                  type="button"
                  className="game-cover-btn"
                  onClick={() => setLightboxIndex(coverIndex)}
                  aria-label={`View ${game.name} cover art`}
                >
                  <img className="game-cover" src={coverFull} alt={game.name} />
                </button>
              )}

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
          )}

          <div className="game-layout__content">
            <dl className="game-meta">
              <div className="game-meta__item">
                <dt>Console</dt>
                <dd>{consoleName || game.platforms?.map((p) => p.name).join(", ") || "Unknown"}</dd>
              </div>
              <div className="game-meta__item">
                <dt>Developer</dt>
                <dd>{game.involved_companies?.map((c) => c.company.name).join(", ") || "Unknown"}</dd>
              </div>
              <div className="game-meta__item">
                <dt>Release year</dt>
                <dd>
                  {game.first_release_date
                    ? new Date(game.first_release_date * 1000).getFullYear()
                    : "Unknown"}
                </dd>
              </div>
            </dl>

            <section className="game-description">
              <h3 className="title is-6">Description</h3>
              <p>{game.summary || "No description available."}</p>
            </section>
          </div>
        </div>

        {copyPhotoEntries.length > 0 && (
          <section className="game-page__section copy-photo-gallery">
            <h3 className="title is-5">Your copy photos</h3>
            <div className="copy-photo-gallery__thumbs">
              {copyPhotoEntries.map((entry) => (
                <button
                  key={entry.path}
                  type="button"
                  className="copy-photo-gallery__thumb"
                  onClick={() => setActiveCopyPhotoPath(entry.path)}
                  aria-label={`View ${entry.alt}`}
                >
                  <StorageImage
                    path={entry.path}
                    alt={entry.alt}
                    className="copy-photo-gallery__image"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {ownedCopies.length > 0 && (
          <section className="game-page__section owned-copies">
            <h3 className="title is-5">Your copies</h3>
            <div className="owned-copies__list">
              {ownedCopies.map((copy, index) => (
                <article key={copy.id} className="owned-copy-card">
                  <StorageImage
                    path={copy.photoPaths?.[0]}
                    alt={`${copy.title} copy ${index + 1}`}
                    className="owned-copy-card__image"
                  />
                  <div>
                    <strong>Copy {index + 1}</strong>
                    <p>{copy.condition}</p>
                    <span className="tag is-light">{copy.visibility}</span>
                  </div>
                  <div className="owned-copy-card__actions">
                    <button
                      type="button"
                      className="button is-small"
                      onClick={() => onEditGame?.(copy)}
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      className="button is-danger is-small"
                      onClick={() => onDeleteGame?.(copy)}
                    >
                      delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <CommunityCopiesRail
          igdbId={igdbId}
          igdbPlatformId={igdbPlatformId}
          currentUserId={currentUserId}
          onSelectCopy={onSelectCommunityCopy}
        />
      </div>

      {activeCopyPhotoPath && (
        <div
          className="screenshot-lightbox"
          onClick={() => setActiveCopyPhotoPath(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Copy photo viewer"
        >
          <button
            type="button"
            className="screenshot-lightbox__close"
            onClick={() => setActiveCopyPhotoPath(null)}
            aria-label="Close"
          >
            ×
          </button>
          <StorageImage
            path={activeCopyPhotoPath}
            alt="Your copy photo"
            className="screenshot-lightbox__image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

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
