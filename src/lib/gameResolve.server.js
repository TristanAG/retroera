import { postIgdbQuery } from "@/lib/igdbProxy";
import { CONSOLE_TO_IGDB_PLATFORM } from "@/lib/igdbService";
import {
  PLATFORM_SLUG_TO_ID,
  getGameSlug,
  getPlatformSlug,
  slugifySegment,
} from "@/lib/gamePaths";

const IGDB_PLATFORM_TO_CONSOLE = Object.fromEntries(
  Object.entries(CONSOLE_TO_IGDB_PLATFORM).map(([name, id]) => [id, name])
);

function gameOnPlatform(game, platformId) {
  const platforms = game.platforms ?? [];
  return platforms.some((p) =>
    typeof p === "number" ? p === platformId : p?.id === platformId
  );
}

function normalizeGameRecord(game, platformId) {
  if (!game?.id) return null;
  const slug = getGameSlug({ slug: game.slug, name: game.name });
  return {
    igdbId: String(game.id),
    igdbPlatformId: Number(platformId),
    title: game.name,
    consoleName: IGDB_PLATFORM_TO_CONSOLE[platformId] ?? "",
    slug,
    platformSlug: getPlatformSlug(platformId),
    gameSlug: slug,
  };
}

export async function resolveGameBySlugs(platformSlug, gameSlug) {
  const platformId = PLATFORM_SLUG_TO_ID[platformSlug];
  if (!platformId || !gameSlug) return null;

  const escapedSlug = String(gameSlug).replace(/"/g, '\\"');
  let results = await postIgdbQuery(`
    fields id,name,slug,platforms,summary,first_release_date,involved_companies.company.name,screenshots.image_id,screenshots.url,cover.image_id,cover.url;
    where slug = "${escapedSlug}";
    limit 10;
  `);

  let match = results.find((game) => gameOnPlatform(game, platformId));
  if (!match && results.length === 1) {
    match = gameOnPlatform(results[0], platformId) ? results[0] : null;
  }

  if (!match) {
    const nameGuess = String(gameSlug).replace(/-/g, " ").trim();
    if (!nameGuess) return null;
    const escapedName = nameGuess.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    results = await postIgdbQuery(`
      search "${escapedName}";
      fields id,name,slug,platforms,summary,first_release_date,involved_companies.company.name,screenshots.image_id,screenshots.url,cover.image_id,cover.url;
      where platforms = (${platformId});
      limit 10;
    `);
    match =
      results.find(
        (game) =>
          gameOnPlatform(game, platformId) &&
          (game.slug === gameSlug || slugifySegment(game.name) === gameSlug)
      ) ?? results.find((game) => gameOnPlatform(game, platformId));
  }

  return match ? normalizeGameRecord(match, platformId) : null;
}

export async function resolveGameByIds(igdbId, platformId) {
  const data = await postIgdbQuery(`
    fields id,name,slug,platforms,summary,first_release_date,involved_companies.company.name,screenshots.image_id,screenshots.url,cover.image_id,cover.url;
    where id = ${Number(igdbId)};
  `);

  if (!data?.length) return null;
  return normalizeGameRecord(data[0], platformId);
}
