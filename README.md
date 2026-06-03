# RetroEra

RetroEra is a retro physical media social network focused on helping users catalog, display, and value their physical game collections. The long-term product vision includes marketplace activity (buy/sell/trade), while the current codebase is focused on collection management and discovery.

# MVP PHASES

## PHASE I
- Catalogue management tracking collection and values
  - ability to browse all games via IGDB and add entries to collection
  - ability to search for games via IGDB and add entries to collection
  - set price with a reference to pricecharting (currently external link)
  - ability to view / browse collection, filter by console, price, alphabetical
  - proper navigation, back buttons lead to previous page

## PHASE II
- Social layer
  - Activity feed of all different user updates
    - First goal is just tracking 'Add' or 'Edit' operations
  - User list
    - User Stats (member since xx.xx, collection value)
    - User index page (able to view / browse other users collections in same interface)

## Phase III
- Marketplace
  - Users can list games for sale
  - Users can buy / sell with other users 
    - Most likely using stripe
  - Develop monetization strategy where I recieve a tiny portion of the transactions as a platform fee or whatever
    - think through all the test cases here for Users to transact with each other
      - Transactions show up in Social Layer / social feed


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

