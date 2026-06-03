import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
);

app.use(express.json());

let cachedToken = null;
let tokenExpiresAt = 0;

function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

// Fetch + cache Twitch OAuth token
async function getTwitchToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in server/.env"
    );
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token` +
      `?client_id=${clientId}` +
      `&client_secret=${clientSecret}` +
      `&grant_type=client_credentials`,
    { method: "POST" }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    clearTokenCache();
    throw new Error(data.message || "Failed to obtain Twitch OAuth token");
  }

  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;

  return cachedToken;
}

function isIgdbAuthFailure(data, status) {
  return (
    status === 401 ||
    (data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      String(data.message || "").includes("Authorization"))
  );
}

async function postIgdbQuery(query, allowRetry = true) {
  const token = await getTwitchToken();

  const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: query,
  });

  const text = await igdbResponse.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const error = new Error("Invalid JSON response from IGDB");
      error.status = igdbResponse.status || 502;
      throw error;
    }
  }

  if (isIgdbAuthFailure(data, igdbResponse.status) && allowRetry) {
    clearTokenCache();
    return postIgdbQuery(query, false);
  }

  if (!igdbResponse.ok || isIgdbAuthFailure(data, igdbResponse.status)) {
    const message =
      (data && typeof data === "object" && !Array.isArray(data)
        ? data.message || data.title
        : null) ||
      (igdbResponse.status ? `IGDB request failed (HTTP ${igdbResponse.status})` : "IGDB request failed");
    const error = new Error(message);
    error.status = igdbResponse.status || 502;
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

// Proxy endpoint for IGDB search (existing)
app.post("/api/igdb", async (req, res) => {
  const query = req.body?.query;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing IGDB query" });
  }

  try {
    const data = await postIgdbQuery(query);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      error: error.message || "IGDB request failed",
    });
  }
});

// -------------------------
// New route: GET game by IGDB ID
// -------------------------
app.get("/api/igdb/game/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "Missing game ID" });

  try {
    const data = await postIgdbQuery(`
        fields id,name,summary,first_release_date,platforms.name,involved_companies.company.name,screenshots.image_id,screenshots.url,cover.image_id,cover.url;
        where id = ${id};
      `);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(data[0]);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "Failed to fetch game data" });
  }
});

// Start server
app.listen(4000, () => {
  console.log("IGDB proxy running on http://localhost:4000");
});
