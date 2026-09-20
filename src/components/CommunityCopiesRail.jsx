"use client";

import { useEffect, useState } from "react";
import { getPublicCopiesByGame } from "@/lib/copyService";
import { getProfiles } from "@/lib/profileService";
import CopyCard from "./CopyCard";

const CommunityCopiesRail = ({
  igdbId,
  igdbPlatformId,
  currentUserId,
  onSelectCopy,
}) => {
  const [copies, setCopies] = useState([]);
  const [profiles, setProfiles] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [visibleLimit, setVisibleLimit] = useState(8);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!igdbId || !igdbPlatformId) {
        setCopies([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const publicCopies = await getPublicCopiesByGame(
          igdbId,
          igdbPlatformId,
          100
        );
        const communityCopies = publicCopies.filter(
          (copy) => copy.ownerId !== currentUserId
        );
        const visibleCopies = communityCopies.slice(0, visibleLimit);
        const loadedProfiles = await getProfiles(
          visibleCopies.map((copy) => copy.ownerId)
        );
        if (active) {
          setCopies(visibleCopies);
          setHasMore(communityCopies.length > visibleLimit);
          setProfiles(loadedProfiles);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load community copies");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [igdbId, igdbPlatformId, currentUserId, reloadKey, visibleLimit]);

  return (
    <aside className="community-copy-rail" aria-labelledby="community-copy-title">
      <h3 id="community-copy-title" className="title is-5">
        Community copies
      </h3>
      {loading && <p>Loading copies…</p>}
      {!loading && error && (
        <div>
          <p className="has-text-danger">{error}</p>
          <button
            type="button"
            className="button is-small mt-2"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && copies.length === 0 && (
        <p className="has-text-grey">
          No collectors have shared this game yet.
        </p>
      )}
      {!loading && !error && copies.length > 0 && (
        <>
          <div className="community-copy-rail__list">
            {copies.map((copy) => (
              <CopyCard
                key={copy.id}
                copy={copy}
                displayName={profiles.get(copy.ownerId)?.displayName ?? "Collector"}
                onSelect={onSelectCopy}
              />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className="button is-small is-fullwidth mt-3"
              onClick={() => setVisibleLimit((current) => current + 8)}
            >
              Load more
            </button>
          )}
        </>
      )}
    </aside>
  );
};

export default CommunityCopiesRail;
