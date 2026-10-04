"use client";

import { useRouter } from "next/navigation";
import GamesList from "@/components/GamesList";
import { useAuth } from "@/context/AuthContext";
import { deleteOwnedCopy } from "@/lib/copyActions";
import { buildGamePath } from "@/lib/gamePaths";

export default function CollectionPage() {
  const { games } = useAuth();
  const router = useRouter();

  const handleSelectGame = ({
    igdbId,
    igdbPlatformId,
    title,
    console: consoleName,
  }) => {
    router.push(
      buildGamePath({
        platformId: igdbPlatformId,
        consoleName,
        name: title,
      })
    );
  };

  const handleEditGame = (game) => {
    router.push(`/copies/${game.id}/edit`);
  };

  const handleDeleteGame = async (game) => {
    try {
      const deleted = await deleteOwnedCopy(game);
      if (deleted) {
        router.refresh();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <GamesList
      games={games}
      onSelectGame={handleSelectGame}
      onEditGame={handleEditGame}
      onDeleteGame={handleDeleteGame}
    />
  );
}
