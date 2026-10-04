"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Game from "@/components/Game";
import { useAuth } from "@/context/AuthContext";
import { deleteOwnedCopy } from "@/lib/copyActions";
import { buildGamePath, stashAddCopyPrefill } from "@/lib/gamePaths";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { user, games } = useAuth();

  const platformSlug = String(params.platformSlug ?? "");
  const gameSlug = String(params.gameSlug ?? "");

  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGame() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/igdb/games/${encodeURIComponent(platformSlug)}/${encodeURIComponent(gameSlug)}`
        );
        const data = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok) {
          throw new Error(data?.error || "Game not found");
        }
        setResolved(data);

        const canonicalPath = buildGamePath({
          platformId: data.igdbPlatformId,
          slug: data.slug,
          name: data.title,
        });
        const currentPath = `/games/${platformSlug}/${gameSlug}`;
        if (canonicalPath !== currentPath) {
          router.replace(canonicalPath);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load game");
          setResolved(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (platformSlug && gameSlug) loadGame();
    return () => {
      active = false;
    };
  }, [platformSlug, gameSlug, router]);

  const igdbId = resolved?.igdbId ?? "";
  const igdbPlatformId = resolved?.igdbPlatformId ?? 0;
  const title = resolved?.title ?? "Game";
  const consoleName = resolved?.consoleName ?? "";

  const ownedCopiesForGame = useMemo(
    () =>
      games.filter(
        (game) =>
          String(game.igdbId ?? game.igdb_id) === String(igdbId) &&
          Number(game.igdbPlatformId ?? game.igdb_platform_id) ===
            Number(igdbPlatformId)
      ),
    [games, igdbId, igdbPlatformId]
  );

  const handleBack = () => {
    router.back();
  };

  const handleAddToCollection = () => {
    stashAddCopyPrefill({
      igdbId,
      platformId: igdbPlatformId,
      title,
      consoleName:
        consoleName ||
        games.find(
          (g) =>
            String(g.igdbId ?? g.igdb_id) === String(igdbId) &&
            Number(g.igdbPlatformId ?? g.igdb_platform_id) ===
              Number(igdbPlatformId)
        )?.console ||
        "",
    });
    router.push("/collection/add");
  };

  const handleEditGame = (game) => {
    router.push(`/copies/${game.id}/edit`);
  };

  const handleDeleteGame = async (game) => {
    try {
      await deleteOwnedCopy(game);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSelectCommunityCopy = (copy) => {
    router.push(`/copies/${copy.id}`);
  };

  if (loading) return <p>Loading game…</p>;
  if (error) return <p>{error}</p>;
  if (!resolved) return <p>Game not found.</p>;

  return (
    <Game
      igdbId={igdbId}
      igdbPlatformId={igdbPlatformId}
      consoleName={consoleName}
      title={title}
      isInCollection={ownedCopiesForGame.length > 0}
      ownedCopies={ownedCopiesForGame}
      currentUserId={user?.uid}
      onAddToCollection={handleAddToCollection}
      onEditGame={handleEditGame}
      onDeleteGame={handleDeleteGame}
      onSelectCommunityCopy={handleSelectCommunityCopy}
      onBack={handleBack}
    />
  );
}
