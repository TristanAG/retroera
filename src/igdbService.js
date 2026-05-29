const IGDB_API_URL = "/api/igdb";

export const CONSOLE_TO_IGDB_PLATFORM = {
  Playstation: 7,
  "Playstation 2": 8,
  GameCube: 21,
  "Game Boy": 33,
  "Game Boy Color": 22,
  "Game Boy Advance": 24,
  Dreamcast: 23,
};

function escapeIgdbSearchTerm(title) {
  return title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function searchGamesByTitle(title, consoleName) {
  const platformId = CONSOLE_TO_IGDB_PLATFORM[consoleName];
  if (!platformId || !title || title.trim().length < 3) {
    return [];
  }

  const escapedTitle = escapeIgdbSearchTerm(title.trim());
  const query = `search "${escapedTitle}"; fields id,name,first_release_date,platforms; limit 50;`;

  const res = await fetch(IGDB_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error("Failed to search IGDB");
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error("Unexpected IGDB response");
  }

  if (data.length > 0 && data[0].status >= 400) {
    throw new Error(data[0].title || "IGDB search failed");
  }

  return data
    .filter((game) => {
      if (game.id == null || !game.name) return false;
      const platforms = game.platforms ?? [];
      return platforms.some((p) =>
        typeof p === "number" ? p === platformId : p?.id === platformId
      );
    })
    .slice(0, 8)
    .map((game) => ({
      id: String(game.id),
      name: game.name,
      releaseYear: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null,
    }));
}
