# Server directory

The Express IGDB proxy (`index.js`) is **legacy**. IGDB requests are handled by Next.js Route Handlers:

- `POST /api/igdb` → `src/app/api/igdb/route.js`
- `GET /api/igdb/game/[id]` → `src/app/api/igdb/game/[id]/route.js`

Twitch credentials live in the root `.env.local` as `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.

[`project-todo.md`](project-todo.md) is the product roadmap and MVP build plan.
