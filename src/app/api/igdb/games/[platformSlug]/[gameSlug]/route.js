import { resolveGameByIds, resolveGameBySlugs } from "@/lib/gameResolve.server";
import { isLegacyNumericGamePath } from "@/lib/gamePaths";

export async function GET(_request, { params }) {
  const { platformSlug, gameSlug } = await params;

  if (!platformSlug || !gameSlug) {
    return Response.json({ error: "Missing game path" }, { status: 400 });
  }

  try {
    const resolved = isLegacyNumericGamePath(platformSlug, gameSlug)
      ? await resolveGameByIds(platformSlug, Number(gameSlug))
      : await resolveGameBySlugs(platformSlug, gameSlug);

    if (!resolved) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    return Response.json(resolved);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message || "Failed to resolve game" },
      { status: error.status || 500 }
    );
  }
}
