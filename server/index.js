import express from "express";
import dotenv from "dotenv";
import cors from "cors";

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

// Proxy endpoint for IGDB
app.post("/api/igdb", async (req, res) => {
  try {
    const token = await getTwitchToken();

    const igdbResponse = await fetch(
      "https://api.igdb.com/v4/games",
      {
        method: "POST",
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
        body: req.body.query,
      }
    );

    const data = await igdbResponse.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "IGDB request failed" });
  }
});

// Start server
app.listen(4000, () => {
  console.log("IGDB proxy running on http://localhost:4000");
});
