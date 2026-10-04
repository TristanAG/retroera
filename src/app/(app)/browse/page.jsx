"use client";

import { useRouter } from "next/navigation";
import Explore from "@/components/Explore";
import { CONSOLE_TO_IGDB_PLATFORM } from "@/lib/igdbService";
import { buildGamePath } from "@/lib/gamePaths";

export default function BrowsePage() {
  const router = useRouter();

  const handleSelectGame = ({
    igdbId,
    igdbPlatformId,
    title,
    console: consoleName,
    slug,
  }) => {
    const platformId =
      Number(igdbPlatformId) || CONSOLE_TO_IGDB_PLATFORM[consoleName];
    router.push(
      buildGamePath({
        platformId,
        consoleName,
        slug,
        name: title,
      })
    );
  };

  return <Explore onSelectGame={handleSelectGame} />;
}
