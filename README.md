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
├── src/                    # React 19 + Vite frontend
├── server/                 # Express IGDB proxy + project planning docs
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Composite indexes
├── storage.rules           # Storage security rules
├── storage.cors.json       # Bucket CORS config (apply via gcloud)
└── firebase.json           # Firebase CLI config
```

Key frontend modules:

- `src/App.jsx` — routing and application shell
- `src/copyService.js` — canonical copy CRUD and migration
- `src/storageService.js` — image processing and Firebase Storage
- `src/profileService.js` — public display names
- `src/igdbService.js` — IGDB API client (via Express proxy)

---

## Current functionality

- Firebase email/password authentication
- Public collector display names (email never exposed)
- Canonical physical-copy records — multiple copies per game/platform
- Private per-copy estimated values and aggregate collection totals
- Private-by-default or public copy visibility
- Up to five ordered photos per copy (JPEG, PNG, WebP, HEIC) with client-side processing:
  - HEIC-to-JPEG conversion, resize, WebP compression
  - corrected camera orientation, stripped EXIF/GPS metadata
- IGDB-backed game browse, search, covers, screenshots, and metadata
- Console-filtered and value-sorted collection browsing
- Platform-specific community-copy rail on game pages
- Read-only public copy details with a clear “Not currently for sale” state
- Basic public-copy reporting for administrative moderation
- Automatic, idempotent migration from the legacy collection structure

Public copy visibility does not mean a copy is for sale. Listings (when built) will reference `copyId` as a separate record — see `server/project-todo.md`.

---

## Architecture

- **Frontend:** React 19 + Vite in `src/`
- **IGDB proxy:** Express in `server/index.js`
  - `POST /api/igdb`
  - `GET /api/igdb/game/:id`
- **Firebase**
  - Authentication: email/password
  - Firestore: copies, owner-private metadata, profiles, reports
  - Storage: processed physical-copy photos
  - version-controlled rules and indexes: `firestore.rules`, `storage.rules`, `firestore.indexes.json`

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

Owner-only metadata:

- `users/{uid}/copyPrivate/{copyId}` — private estimated value and future private collection fields

Social and moderation:

- `profiles/{uid}` — public display name only
- `reports/{reportId}` — write-only reports for administrative review

Photos:

- `users/{uid}/copies/{copyId}/{photoId}.webp`

The former `users/{uid}/games` structure is read only by the migration path. Active collection operations use canonical copies.

---

## Local setup

**Requirements:**

- Node.js 20 recommended (`.nvmrc`); Node 18 or newer supported
- A Firebase project with Email/Password Auth, Firestore, and Storage enabled
- Twitch/IGDB API credentials for the Express proxy

Create a root `.env` (see `.env.example`):

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Create `server/.env` (see `server/.env.example`):

```text
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

Install and run:

```bash
npm install
npm run dev
```

In another terminal:

```bash
cd server
npm install
npm start
```

The Vite dev server proxies IGDB requests to the Express server on port 3001.

---

## npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run firebase:deploy:firestore` | Deploy Firestore rules and indexes |
| `npm run firebase:deploy:storage` | Deploy Storage rules |
| `npm run firebase:deploy:rules` | Deploy Firestore + Storage rules |

---

## Firebase deployment

Deploy Firestore rules and indexes:

```bash
npm run firebase:deploy:firestore
```

Photo uploads require Firebase Storage initialized in the [Firebase console](https://console.firebase.google.com/) (Blaze plan). Then deploy Storage rules:

```bash
npm run firebase:deploy:storage
```

Or deploy both:

```bash
npm run firebase:deploy:rules
```

The first Storage rules deployment that reads Firestore for public copy photos may prompt a project owner to grant cross-service access between Storage and Firestore.

Direct browser image reads require Storage bucket CORS. Apply `storage.cors.json` and add production origins before deployment:

```bash
gcloud storage buckets update gs://YOUR_BUCKET --cors-file=storage.cors.json
```

`storage.cors.json` contains only the local Vite origin by default.

Use the Firebase Emulator Suite for Firestore and Storage rules verification before deploying.

---

## Migration behavior

After authentication, RetroEra checks the signed-in user's migration version and converts each legacy flat game document into:

1. one private canonical copy;
2. one owner-private value record.

Copy IDs are deterministic from the legacy owner/document pair, so interrupted migrations can resume without creating duplicates. Work is committed in bounded batches; legacy documents are not deleted by this release.

---

## Security

- New copies are always created as private drafts and become public only after photo and metadata writes complete.
- Firestore rules prevent ownership reassignment and cross-user access to private values.
- Storage rules permit owner reads/writes and community reads only for public copies.
- Uploaded files are validated, resized, compressed, and stripped of metadata.
- Account email addresses are not part of public profiles or copy cards.

Full release checklist: [`QA_COMMUNITY_COPIES.md`](QA_COMMUNITY_COPIES.md)

---

## Known limitations

These reflect the **current codebase**, not the long-term plan. See [`server/project-todo.md`](server/project-todo.md) for what comes next.

- Public profiles store display names only — no browsable profile pages or usernames yet.
- No listings, offers, payments, or in-app messaging.
- Reports require manual Firebase review; no moderator dashboard.
- Community-copy queries are intentionally bounded (no pagination yet).
- eBay integration scaffolding exists in `src/ebayService.js` but is not wired into primary flows.
