import { CONSOLE_TO_IGDB_PLATFORM } from "@/lib/igdbService";

/** Short, readable platform slugs for URLs like /games/ps2/ico */
export const PLATFORM_ID_TO_SLUG = {
  50: "3do",
  62: "jaguar",
  61: "lynx",
  23: "dreamcast",
  33: "game-boy",
  24: "gba",
  22: "gbc",
  21: "gamecube",
  80: "neo-geo-aes",
  136: "neo-geo-cd",
  119: "neo-geo-pocket",
  120: "ngp-color",
  4: "n64",
  18: "nes",
  274: "pc-fx",
  117: "cd-i",
  7: "ps1",
  8: "ps2",
  30: "32x",
  78: "sega-cd",
  35: "game-gear",
  29: "genesis",
  32: "saturn",
  19: "snes",
  86: "turbografx-16",
  87: "virtual-boy",
  57: "wonderswan",
  123: "ws-color",
};

export const PLATFORM_SLUG_TO_ID = Object.fromEntries(
  Object.entries(PLATFORM_ID_TO_SLUG).map(([id, slug]) => [slug, Number(id)])
);

export const CONSOLE_TO_PLATFORM_SLUG = Object.fromEntries(
  Object.entries(CONSOLE_TO_IGDB_PLATFORM).map(([consoleName, platformId]) => [
    consoleName,
    PLATFORM_ID_TO_SLUG[platformId] ?? slugifySegment(consoleName),
  ])
);

export function slugifySegment(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function getPlatformSlug(platformId, consoleName) {
  const id = Number(platformId);
  if (PLATFORM_ID_TO_SLUG[id]) return PLATFORM_ID_TO_SLUG[id];
  if (consoleName && CONSOLE_TO_PLATFORM_SLUG[consoleName]) {
    return CONSOLE_TO_PLATFORM_SLUG[consoleName];
  }
  return slugifySegment(consoleName || "unknown");
}

export function getGameSlug({ slug, igdbSlug, name, title } = {}) {
  return slug || igdbSlug || slugifySegment(name || title || "");
}

export function buildGamePath({
  platformId,
  igdbPlatformId,
  consoleName,
  slug,
  igdbSlug,
  name,
  title,
} = {}) {
  const platformSlug = getPlatformSlug(
    platformId ?? igdbPlatformId,
    consoleName
  );
  const gameSlug = getGameSlug({ slug, igdbSlug, name, title });
  if (!platformSlug || !gameSlug) return "/browse";
  return `/games/${platformSlug}/${gameSlug}`;
}

export function isLegacyNumericGamePath(platformSlug, gameSlug) {
  return /^\d+$/.test(String(platformSlug)) && /^\d+$/.test(String(gameSlug));
}

export const ADD_COPY_PREFILL_KEY = "retroera:addCopyPrefill";

export function stashAddCopyPrefill({ igdbId, platformId, title, consoleName }) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    ADD_COPY_PREFILL_KEY,
    JSON.stringify({ igdbId, platformId, title, console: consoleName })
  );
}

export function readAddCopyPrefill() {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(ADD_COPY_PREFILL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAddCopyPrefill() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(ADD_COPY_PREFILL_KEY);
}
