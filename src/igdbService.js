const IGDB_API_URL = "/api/igdb";

function extractImageId(asset) {
  if (!asset) return null;
  if (typeof asset === "string") return asset;
  if (asset.image_id) return asset.image_id;
  if (asset.url) {
    const match = asset.url.match(/\/([^/]+)\.(jpg|png)$/i);
    return match?.[1] ?? null;
  }
  return null;
}

export function igdbImageUrl(assetOrId, size = "1080p") {
  const imageId = extractImageId(assetOrId);
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export const CONSOLE_TO_IGDB_PLATFORM = {
  "3DO": 50,
  "Atari Jaguar": 62,
  "Atari Lynx": 61,
  Dreamcast: 23,
  "Game Boy": 33,
  "Game Boy Advance": 24,
  "Game Boy Color": 22,
  GameCube: 21,
  "Neo Geo AES": 80,
  "Neo Geo CD": 136,
  "Neo Geo Pocket": 119,
  "Neo Geo Pocket Color": 120,
  "Nintendo 64": 4,
  "Nintendo Entertainment System": 18,
  "PC-FX": 274,
  "Philips CD-i": 117,
  Playstation: 7,
  "Playstation 2": 8,
  "Sega 32X": 30,
  "Sega CD": 78,
  "Sega Game Gear": 35,
  "Sega Genesis": 29,
  "Sega Saturn": 32,
  "Super Nintendo": 19,
  "TurboGrafx-16": 86,
  "Virtual Boy": 87,
  WonderSwan: 57,
  "WonderSwan Color": 123,
};

export const CONSOLE_OPTIONS = Object.keys(CONSOLE_TO_IGDB_PLATFORM).sort((a, b) =>
  a.localeCompare(b)
);

export const PAGE_SIZE = 20;

/** IGDB release_date_regions ids (release_dates.release_region) */
export const EXPLORE_REGIONS = [
  { id: 2, label: "US" },
  { id: 1, label: "Europe" },
  { id: 5, label: "Japan" },
  { id: 3, label: "Australia" },
  { id: 9, label: "Korea" },
  { id: 10, label: "Brazil" },
  { id: 8, label: "Worldwide" },
];

export const DEFAULT_EXPLORE_REGION_IDS = [2];

function buildRegionFilter(regionIds) {
  const ids =
    regionIds?.length > 0 ? regionIds : DEFAULT_EXPLORE_REGION_IDS;
  if (ids.length === 1) return `release_dates.release_region = ${ids[0]}`;
  return `release_dates.release_region = (${ids.join(",")})`;
}

function buildNamePrefixFilter(namePrefix) {
  if (!namePrefix) return "";
  if (namePrefix === "#") {
    const digitPrefixes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (d) => `name ~ "${d}*"`
    );
    return ` & (${digitPrefixes.join(" | ")})`;
  }
  const letter = namePrefix.toUpperCase();
  return ` & (name ~ "${letter}*" | name ~ "${letter.toLowerCase()}*")`;
}

function mapGameResult(game) {
  return {
    id: String(game.id),
    name: game.name,
    releaseYear: game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear()
      : null,
    coverUrl: igdbImageUrl(game.cover, "cover_big"),
  };
}

export async function fetchGamesByPlatform(
  platformId,
  {
    limit = PAGE_SIZE,
    offset = 0,
    regionIds = DEFAULT_EXPLORE_REGION_IDS,
    namePrefix = null,
    sort = "name asc",
  } = {}
) {
  const nameFilter = buildNamePrefixFilter(namePrefix);
  const query = `
    fields id,name,cover.image_id,first_release_date;
    where platforms = ${platformId} & ${buildRegionFilter(regionIds)}${nameFilter};
    sort ${sort};
    limit ${limit};
    offset ${offset};
  `;

  const res = await fetch(IGDB_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch IGDB games");
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error("Unexpected IGDB response");
  }

  if (data.length > 0 && data[0].status >= 400) {
    throw new Error(data[0].title || "IGDB request failed");
  }

  return data
    .filter((game) => game.id != null && game.name)
    .map(mapGameResult);
}

function escapeIgdbSearchTerm(title) {
  return title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function tokenizeSearchQuery(title) {
  return title
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function buildWordNameFilters(title) {
  const words = tokenizeSearchQuery(title);
  if (words.length === 0) return null;
  return words
    .map((word) => `name ~ *"${escapeIgdbSearchTerm(word)}"*`)
    .join(" & ");
}

function scoreSearchMatch(name, query) {
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  const words = tokenizeSearchQuery(queryLower);

  let score = 0;
  if (nameLower === queryLower) score += 1000;
  if (nameLower.startsWith(queryLower)) score += 500;
  if (nameLower.includes(queryLower)) score += 300;

  for (const word of words) {
    if (nameLower.includes(word)) score += 60;
    if (nameLower.split(/\s+/).some((part) => part.startsWith(word))) score += 30;
  }

  score -= name.length * 0.05;
  return score;
}

function rankSearchResults(games, query) {
  return [...games].sort((a, b) => {
    const scoreDiff = scoreSearchMatch(b.name, query) - scoreSearchMatch(a.name, query);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  });
}

function gameOnPlatform(game, platformId) {
  const platforms = game.platforms ?? [];
  return platforms.some((p) =>
    typeof p === "number" ? p === platformId : p?.id === platformId
  );
}

async function postIgdbQuery(query) {
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

  return data;
}

export async function searchGamesByPlatform(
  title,
  platformId,
  { limit = 50 } = {}
) {
  if (!platformId || !title || title.trim().length < 3) {
    return [];
  }

  const trimmedTitle = title.trim();
  const wordFilters = buildWordNameFilters(trimmedTitle);
  if (!wordFilters) return [];

  const escapedTitle = escapeIgdbSearchTerm(trimmedTitle);
  const fetchLimit = Math.min(limit * 2, 100);

  // Platform + name filters in one where clause miss some IGDB entries (e.g. Metroid
  // Fusion on GBA). Search with a platform filter works for similarity; name filters
  // run without a platform constraint and are narrowed client-side.
  const similarityQuery = `
    search "${escapedTitle}";
    fields id,name,first_release_date,cover.image_id,platforms;
    where platforms = (${platformId});
    limit ${fetchLimit};
  `;
  const filterQuery = `
    fields id,name,first_release_date,cover.image_id,platforms;
    where ${wordFilters};
    limit ${fetchLimit};
  `;

  const [similarityResults, filterResults] = await Promise.all([
    postIgdbQuery(similarityQuery).catch(() => []),
    postIgdbQuery(filterQuery).catch(() => []),
  ]);

  const seen = new Set();
  const merged = [];

  for (const game of [...similarityResults, ...filterResults]) {
    if (game.id == null || !game.name || seen.has(game.id)) continue;
    if (!gameOnPlatform(game, platformId)) continue;
    seen.add(game.id);
    merged.push(game);
  }

  return rankSearchResults(merged, trimmedTitle)
    .slice(0, limit)
    .map(mapGameResult);
}
