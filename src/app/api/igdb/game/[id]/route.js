import { postIgdbQuery } from "@/lib/igdbProxy";

export async function GET(_request, { params }) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Missing game ID" }, { status: 400 });
  }

  try {
    const data = await postIgdbQuery(`
        fields id,name,slug,summary,first_release_date,platforms.name,involved_companies.company.name,screenshots.image_id,screenshots.url,cover.image_id,cover.url;
        where id = ${id};
      `);

    if (!data || data.length === 0) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    return Response.json(data[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message || "Failed to fetch game data" },
      { status: error.status || 500 }
    );
  }
}
