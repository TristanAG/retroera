# RetroEra

RetroEra is a retro physical media social network for cataloging, displaying, and valuing physical game collections. Collection ownership is the foundation, the social layer makes shared copies discoverable, and the long-term product vision adds safe buy/sell/trade activity without treating every public item as merchandise.

## MVP phases

### Phase I: collection management

- Complete: browse and search IGDB games across 28 retro platforms.
- Complete: own multiple physical copies of the same game and platform.
- Complete: track condition and a private estimated value for each copy.
- Complete: upload, order, replace, and remove up to five physical-copy photos.
- Complete: keep copies private or share them publicly.
- Complete: browse collection totals and filter by console.
- Complete: use PriceCharting as an external valuation reference.
- Future: add physical consoles as first-class collection items.
- Future: refine condition categories and integrate richer valuation data when a viable source is available.

### Phase II: social layer

- Foundation complete: public display-name profiles.
- Foundation complete: community copies on platform-specific game pages.
- Foundation complete: read-only public copy details and content reporting.
- Future: public profile and collection pages.
- Future: user discovery, member statistics, following, and activity feeds.
- Future: record collection add/edit activity and eventual marketplace events.

### Phase III: marketplace

- Future: create sale listings linked to physical copy records.
- Future: browse active listings separately from public showcase copies.
- Future: offers, reservations, purchases, shipping, refunds, and disputes.
- Future: Stripe-based seller payments and a sustainable platform-fee model.
- Future: surface completed transactions in the social layer where appropriate.

Public visibility does not mean a copy is for sale. Marketplace availability will come from a separate active listing linked to the copy.

## Current functionality

- Firebase email/password authentication.
- Public collector display names without exposing account email addresses.
- Canonical physical-copy records supporting multiple copies of one release.
- Private per-copy estimated values and aggregate collection values.
- Private-by-default or public copy visibility.
- Up to five ordered JPEG, PNG, WebP, or iPhone HEIC photos per copy:
  - automatic HEIC-to-JPEG conversion in the browser;
  - client-side resizing and WebP compression;
  - corrected camera orientation;
  - stripped EXIF/GPS metadata;
  - a primary image used in collection and community previews.
- IGDB-backed game details, covers, screenshots, release information, and companies.
- Console-filtered and value-sorted collection browsing.
- Platform-specific community-copy rail with public owner, photo, and condition.
- Read-only public copy details with a clear “Not currently for sale” state.
- Basic public-copy reporting for administrative moderation.
- Automatic, idempotent migration from the legacy collection structure.

## Architecture

- **Frontend:** React 19 + Vite in `src/`
  - application orchestration: `src/App.jsx`
  - UI features: `src/components/*`
  - canonical copy access and migration: `src/copyService.js`
  - image processing and Storage access: `src/storageService.js`
  - public profiles: `src/profileService.js`
- **IGDB proxy:** Express in `server/index.js`
  - `POST /api/igdb`
  - `GET /api/igdb/game/:id`
- **Firebase**
  - Authentication: email/password
  - Firestore: copies, owner-private metadata, profiles, reports
  - Storage: processed physical-copy photos
  - version-controlled rules and indexes: `firestore.rules`, `storage.rules`, and `firestore.indexes.json`

## Current data model

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

Owner-only metadata is stored separately at:

- `users/{uid}/copyPrivate/{copyId}` — private estimated value and future private collection fields

Social and moderation records use:

- `profiles/{uid}` — public display name only
- `reports/{reportId}` — write-only reports for administrative review

Photos are stored under:

- `users/{uid}/copies/{copyId}/{photoId}.webp`

The former `users/{uid}/games` and console subcollections are read only by the migration path. Existing data is retained for rollback; active collection operations use canonical copies.

Future `listings/{listingId}` records will reference `copyId` instead of adding sale state to the copy itself.

## Local setup

Requirements:

- Node.js 20 recommended (`.nvmrc`); Node 18 or newer supported.
- A Firebase project with Email/Password Auth, Firestore, and Storage enabled.
- Twitch/IGDB API credentials for the Express proxy.

Create a root `.env` containing:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Create `server/.env` containing:

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

Deploy Firebase rules and indexes with the Firebase CLI:

```bash
npm run firebase:deploy:firestore
```

That deploys Firestore rules and indexes, which is enough for profiles, copies,
and community-copy queries.

Photo uploads also require Firebase Storage to be initialized in the console:
[Firebase Storage setup](https://console.firebase.google.com/project/retrobay-e6467/storage)
→ **Get started** (Blaze plan required). After Storage exists, deploy Storage rules:

```bash
npm run firebase:deploy:storage
```

The first Storage rules deployment that read Firestore for public copy photos may
prompt a project owner to grant cross-service access between Storage and
Firestore. Owner uploads work without that grant; community photo reads need it.

Or deploy both once Storage is ready:

```bash
npm run firebase:deploy:rules
```

Direct browser image reads require Storage bucket CORS. Apply `storage.cors.json` to the project bucket and add production origins before deployment:

```bash
gcloud storage buckets update gs://YOUR_BUCKET --cors-file=storage.cors.json
```

`storage.cors.json` contains only the local Vite origin by default.

## Migration behavior

After authentication, RetroEra checks the signed-in user’s migration version and converts each legacy flat game document into:

1. one private canonical copy;
2. one owner-private value record.

Copy IDs are deterministic from the legacy owner/document pair, so interrupted migrations can resume without creating duplicates. Work is committed in bounded batches, progress and mapping errors are recorded, and completion is marked only when every legacy record maps successfully. Legacy documents are not deleted by this release.

## Security and QA

- New copies are always created as private drafts and become public only after photo and metadata writes complete.
- Firestore rules prevent ownership reassignment and cross-user access to private values.
- Storage rules permit owner reads/writes and community reads only for public copies.
- Uploaded files are validated, resized, compressed, and stripped of metadata.
- Account email addresses are not part of public profiles or copy cards.
- The complete release checklist is in `QA_COMMUNITY_COPIES.md`.

Use the Firebase Emulator Suite for Firestore and Storage rules verification before deploying this feature.

## Current limits and future work

- Public profiles currently contain only display names; complete profile pages and social graphs are future work.
- Reports require an administrative Firebase review/takedown process; no moderator dashboard exists yet.
- Community-copy results are intentionally bounded; richer pagination and filtering can be added with marketplace demand.
- Copy details are read-only. There are no listings, offers, payments, trades, transaction messaging, or sale guarantees.
- eBay integration scaffolding exists in `src/ebayService.js` but is not wired into primary flows.
- A future move from Vite to Next.js remains optional and should be justified by routing, server-rendering, or deployment needs.

