"use client";

import { useRouter } from "next/navigation";
import Explore from "@/components/Explore";
import { CONSOLE_TO_IGDB_PLATFORM } from "@/lib/igdbService";

export default function BrowsePage() {
  const router = useRouter();

  const handleSelectGame = ({
    igdbId,
    igdbPlatformId,
    title,
    console: consoleName,
  }) => {
    const platformId =
      Number(igdbPlatformId) || CONSOLE_TO_IGDB_PLATFORM[consoleName];
    router.push(
      `/games/${encodeURIComponent(igdbId)}/${encodeURIComponent(platformId)}?from=browse&title=${encodeURIComponent(title)}&console=${encodeURIComponent(consoleName)}`
    );
  };

  return <Explore onSelectGame={handleSelectGame} />;
}
