let cachedToken = null;
let tokenExpiresAt = 0;

function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function getTwitchToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in environment"
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

export async function postIgdbQuery(query, allowRetry = true) {
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
      (igdbResponse.status
        ? `IGDB request failed (HTTP ${igdbResponse.status})`
        : "IGDB request failed");
    const error = new Error(message);
    error.status = igdbResponse.status || 502;
    throw error;
  }

  return Array.isArray(data) ? data : [];
}
