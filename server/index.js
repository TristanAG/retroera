import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

let cachedToken = null;
let tokenExpiresAt = 0;

// Fetch + cache Twitch OAuth token
async function getTwitchToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token` +
      `?client_id=${process.env.TWITCH_CLIENT_ID}` +
      `&client_secret=${process.env.TWITCH_CLIENT_SECRET}` +
      `&grant_type=client_credentials`,
    { method: "POST" }
  );

  const data = await response.json();

  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;

  return cachedToken;
}

// Proxy endpoint for IGDB search (existing)
app.post("/api/igdb", async (req, res) => {
  try {
    const token = await getTwitchToken();

    const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: req.body.query,
    });

    const data = await igdbResponse.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "IGDB request failed" });
  }
});

// -------------------------
// New route: GET game by IGDB ID
// -------------------------
app.get("/api/igdb/game/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "Missing game ID" });

  try {
    const token = await getTwitchToken();

    const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: `
        fields id,name,summary,first_release_date,platforms.name,involved_companies.company.name,screenshots.url,cover.url;
        where id = ${id};
      `,
    });

    const data = await igdbResponse.json();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(data[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch game data" });
  }
});

// Start server
app.listen(4000, () => {
  console.log("IGDB proxy running on http://localhost:4000");
});
