# RetroEra

RetroEra is a retro physical media social network for cataloging, displaying, and valuing physical game collections. Collection ownership is the foundation; the social layer makes shared copies discoverable; marketplace features build on top without treating every public copy as merchandise.

**Product roadmap and build phases:** [`server/project-todo.md`](server/project-todo.md)

---

## Documentation

| Doc | Purpose |
| --- | --- |
| [`server/project-todo.md`](server/project-todo.md) | MVP phases, acceptance criteria, post-MVP marketplace roadmap |
| [`QA_COMMUNITY_COPIES.md`](QA_COMMUNITY_COPIES.md) | Release and regression checklist |
| [`CHANGELOG.md`](CHANGELOG.md) | Notable changes by release |

---

## Repository layout

```
retroera/
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   ├── components/         # React UI
│   ├── context/            # Auth and shared client state
│   └── lib/                # Firebase, copy, storage, IGDB services
├── server/                 # Project planning docs (legacy Express proxy archived)
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── storage.cors.json
└── firebase.json
```

Key modules:

- `src/context/AuthContext.jsx` — auth, migration, collection subscription
- `src/lib/copyService.js` — canonical copy CRUD and migration
- `src/lib/storageService.js` — image processing and Firebase Storage
- `src/lib/profileService.js` — public display names
- `src/lib/igdbService.js` — IGDB client (via Next.js API routes)
- `src/app/api/igdb/` — Twitch/IGDB proxy (server-side)

---

## Current functionality

- Firebase email/password authentication
- Public collector display names (email never exposed)
- Canonical physical-copy records — multiple copies per game/platform
- Private per-copy estimated values and aggregate collection totals
- Private-by-default or public copy visibility
- Up to five ordered photos per copy (JPEG, PNG, WebP, HEIC) with client-side processing
- IGDB-backed game browse, search, covers, screenshots, and metadata
- Console-filtered and value-sorted collection browsing
- Platform-specific community-copy rail on game pages
- Read-only public copy details with a clear “Not currently for sale” state
- Basic public-copy reporting for administrative moderation
- Automatic, idempotent migration from the legacy collection structure

Public copy visibility does not mean a copy is for sale. Listings (when built) will reference `copyId` as a separate record — see `server/project-todo.md`.

---

## Architecture

- **Frontend:** React 19 + Next.js 16 (App Router) in `src/`
- **IGDB proxy:** Next.js Route Handlers in `src/app/api/igdb/`
  - `POST /api/igdb`
  - `GET /api/igdb/game/[id]`
- **Firebase**
  - Authentication: email/password
  - Firestore: copies, owner-private metadata, profiles, reports
  - Storage: processed physical-copy photos
  - version-controlled rules and indexes: `firestore.rules`, `storage.rules`, `firestore.indexes.json`

Auth-protected routes use a client-side `AuthGate` in `src/app/(app)/layout.jsx`. Public copy detail at `/copies/[copyId]` lives outside the auth shell.

---

## Data model

`copies/{copyId}` is the canonical record for one physical item. Public-readable copy records contain only community-safe data:

- `ownerId`
- `igdbId`
- `igdbPlatformId`
- `console` display label
- `title`
- `condition`
- `visibility` (`private` or `public`)
- up to five ordered `photoPaths`
- creation/update timestamps

Stable `igdbId + igdbPlatformId` identity prevents copies for different platforms from being mixed on one game page.

Owner-only metadata: `users/{uid}/copyPrivate/{copyId}`

Social and moderation: `profiles/{uid}`, `reports/{reportId}`

Photos: `users/{uid}/copies/{copyId}/{photoId}.webp`

---

## Local setup

**Requirements:**

- Node.js 20 recommended (`.nvmrc`); Node 18 or newer supported
- A Firebase project with Email/Password Auth, Firestore, and Storage enabled
- Twitch/IGDB API credentials

Create `.env.local` at the project root (see `.env.example`):

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

Install and run (single command — no separate Express server):

```bash
npm install
npm run dev
```

Open http://localhost:3000

Production preview:

```bash
npm run build
npm run start
```

---

## npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run firebase:deploy:firestore` | Deploy Firestore rules and indexes |
| `npm run firebase:deploy:storage` | Deploy Storage rules |
| `npm run firebase:deploy:rules` | Deploy Firestore + Storage rules |

---

## Deploying to Vercel

1. Connect the repo to [Vercel](https://vercel.com) (Next.js is auto-detected).
2. Set all `NEXT_PUBLIC_FIREBASE_*` and `TWITCH_*` environment variables in the Vercel project settings.
3. Deploy the `main` branch (or your production branch).
4. Add your Vercel production origin to `storage.cors.json` and apply to the Firebase Storage bucket:

```bash
gcloud storage buckets update gs://YOUR_BUCKET --cors-file=storage.cors.json
```

---

## Firebase deployment

```bash
npm run firebase:deploy:firestore
npm run firebase:deploy:storage   # after Storage is enabled in Firebase console
```

Use the Firebase Emulator Suite for Firestore and Storage rules verification before deploying.

---

## Migration behavior

After authentication, RetroEra checks the signed-in user's migration version and converts each legacy flat game document into one private canonical copy and one owner-private value record. Copy IDs are deterministic; legacy documents are not deleted.

---

## Security

- New copies are always created as private drafts and become public only after photo and metadata writes complete.
- Firestore rules prevent ownership reassignment and cross-user access to private values.
- Storage rules permit owner reads/writes and community reads only for public copies.
- Uploaded files are validated, resized, compressed, and stripped of metadata.

Full release checklist: [`QA_COMMUNITY_COPIES.md`](QA_COMMUNITY_COPIES.md)

---

## Known limitations

See [`server/project-todo.md`](server/project-todo.md) for the active roadmap. Current gaps:

- Public profiles store display names only — username/slug profile pages are Phase 1.
- No listings, offers, payments, or in-app messaging.
- Reports require manual Firebase review; no moderator dashboard.
- Community-copy queries are intentionally bounded (no pagination yet).
