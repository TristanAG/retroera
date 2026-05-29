# RetroEra

RetroEra is a retro physical media social network focused on helping users catalog, display, and value their physical game collections. The long-term product vision includes marketplace activity (buy/sell/trade), while the current codebase is focused on collection management and discovery.

## Key Functionality (Currently Implemented)

- User authentication via Firebase email/password.
- Add games to a personal collection with:
  - title
  - console
  - condition
  - estimated value
- View a collection list and aggregate estimated values.
- Filter collection by console and view console-level value totals.
- Fetch and view IGDB-backed game details (summary, release info, companies, media).
- Browse IGDB game catalogs by console (28 retro platforms) with paginated explore view.

## Current Product Scope

### In place today
- Authenticated user accounts.
- Firestore-backed collection storage under each user.
- Real-time console and game subscription views from Firestore.
- IGDB proxy backend (Express) with Twitch OAuth token handling.
- IGDB explore browse via the existing `/api/igdb` proxy.

### Not yet implemented
- Buy/sell/trade marketplace workflows.
- Listings, offers, transactions, or trade negotiation flows.
- Dedicated valuation/allocation model beyond per-game `estimated_value`.

## Architecture Overview

- **Frontend:** React + Vite (`src/`)
  - Main UI orchestration in `src/App.jsx`
  - Core features in `src/components/*`
- **Backend:** Express proxy server (`server/index.js`)
  - `POST /api/igdb`
  - `GET /api/igdb/game/:id`
- **Data & Auth:** Firebase Auth + Firestore
  - Initialization in `src/firebase.js`
  - Auth wrappers in `src/authService.js`
  - Collection data access in `src/firestoreService.js`

## Data Model (Current)

User-scoped Firestore documents are currently organized under:

- `users/{uid}/games/{gameId}`
- `users/{uid}/consoles/{consoleName}`
- `users/{uid}/consoles/{consoleName}/games/{gameId}`

Game documents store:
- `title`
- `console`
- `condition`
- `estimated_value`
- `userId`

## Project Status Notes

- The app is already useful for personal collection tracking and value visibility.
- Marketplace behavior is planned but not active in current code.
- eBay integration scaffolding exists in `src/ebayService.js`, but is not currently wired into primary user flows.
