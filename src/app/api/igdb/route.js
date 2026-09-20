import { postIgdbQuery } from "@/lib/igdbProxy";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body?.query;
  if (!query || typeof query !== "string") {
    return Response.json({ error: "Missing IGDB query" }, { status: 400 });
  }

  try {
    const data = await postIgdbQuery(query);
    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message || "IGDB request failed" },
      { status: error.status || 500 }
    );
  }
}
