"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Game from "@/components/Game";
import { useAuth } from "@/context/AuthContext";
import { deleteOwnedCopy } from "@/lib/copyActions";

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, games } = useAuth();

  const igdbId = String(params.igdbId ?? "");
  const igdbPlatformId = Number(params.platformId);
  const title = searchParams.get("title") ?? "Game";
  const consoleName = searchParams.get("console") ?? "";
  const from = searchParams.get("from") ?? "collection";

  const ownedCopiesForGame = useMemo(
    () =>
      games.filter(
        (game) =>
          String(game.igdbId) === String(igdbId) &&
          Number(game.igdbPlatformId) === Number(igdbPlatformId)
      ),
    [games, igdbId, igdbPlatformId]
  );

  const isGameInCollection = ownedCopiesForGame.length > 0;

  const handleBack = () => {
    if (from === "browse") {
      router.push("/browse");
      return;
    }
    router.push("/collection");
  };

  const handleAddToCollection = () => {
    const query = new URLSearchParams({
      igdbId,
      platformId: String(igdbPlatformId),
      title,
      console: consoleName,
    });
    router.push(`/collection/add?${query.toString()}`);
  };

  const handleEditGame = (game) => {
    router.push(`/copies/${game.id}/edit`);
  };

  const handleDeleteGame = async (game) => {
    try {
      await deleteOwnedCopy(game);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSelectCommunityCopy = (copy) => {
    router.push(`/copies/${copy.id}`);
  };

  return (
    <Game
      igdbId={igdbId}
      igdbPlatformId={igdbPlatformId}
      consoleName={consoleName}
      title={title}
      isInCollection={isGameInCollection}
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
