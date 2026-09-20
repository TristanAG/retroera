# RetroEra — Project TODO

Single source of truth for RetroEra product planning — MVP build phases, acceptance criteria, and post-MVP marketplace roadmap.

## North Star

> "Can someone discover RetroEra and think: I need this."

Not feature-complete. **Demo-complete.**

At MVP, any visitor should be able to:

- Create an account
- Browse thousands of games (via IGDB)
- Add games to their collection
- Upload photos of their copies
- Share their collection publicly
- View other collectors' profiles and collections
- List a game for sale (no Stripe, contact-based)
- Browse the marketplace
- Contact a seller
- Follow a QR code or link straight to the landing page

---

## Philosophy

RetroEra is a **collection platform first**.
The marketplace is an optional layer built on top of collections.

This keeps RetroEra from becoming "another eBay clone."

The product at MVP is:

> "The best place to catalog, showcase, and discover retro game collections."

Marketplace Beta is the quiet introduction of listings — not the headline.

**Critical rule:** Public copy visibility does not mean a copy is for sale. Listings remain separate from `copies/{copyId}`. A copy can be public in the community showcase without being listed, and listing a copy for sale does not change its collection or visibility semantics.

---

## Existing Foundations

Already shipped — build MVP phases on top of this:

- `copies/{copyId}` as canonical physical-item ownership (multiple copies per game/platform)
- Ordered copy photographs with client-side processing (HEIC conversion, resize, WebP compression, EXIF stripping)
- Community discovery through public copies on game pages
- Public display-name profiles (username/slug work is Phase 1)
- Content reporting on public copies
- Private estimated values and aggregate collection totals
- Browse and search IGDB games across retro platforms

---

## What We Are NOT Building for MVP

Do not touch any of the following. These are all v2.

- [ ] Stripe / payments of any kind
- [ ] Shipping integration
- [ ] Reviews or ratings
- [ ] Offers / counter-offers
- [ ] In-app messaging (contact via email is enough)
- [ ] Push or email notifications
- [ ] Native mobile app
- [ ] Admin dashboard
- [ ] Firebase Cloud Functions (unless absolutely necessary)
- [ ] Taxes / compliance
- [ ] Seller identity verification
- [ ] Disputes or refunds

---

## Architecture Reminder

```
IGDB
  |
Browse / Search
  |
Physical Copy (canonical record)
  |
Public / Private toggle
  |
Community Discovery + Marketplace Listings
```

The **physical copy** is the core entity — not a marketplace listing.
One user can own multiple copies of the same game with different conditions, prices, and visibility settings.

---

## Data Models (Reference)

### Existing: `copies` collection

```
copyId
userId
igdbGameId
condition        // Mint | Excellent | Good | Fair | Poor
visibility       // public | private
photos[]
notes
estimatedValue
createdAt
```

### New: `listings` collection

MVP fields:

```
listingId
copyId           // must reference an owned copy; listing inherits photos + condition
sellerId
price            // number
currency         // "usd" for MVP
description      // string, optional
status           // draft | active | sold | removed
createdAt
updatedAt
```

Post-payment fields (do not add until Phase 5):

```
defects          // structured condition notes beyond copy condition badge
shippingMethod   // e.g. "USPS Priority"
shippingCost     // number, optional
reservedAt       // set when checkout starts (Phase 5)
```

Status lifecycle:

- **MVP:** `draft` → `active` → `sold` or `removed` (seller delists)
- **Payments (Phase 5):** add `reserved` (checkout in progress) and `cancelled`

### New: `users` (profile fields to add)

```
username         // slug for /profile/[username]
bio
location         // optional, city/state only
favoriteConsole
favoriteGame
avatarUrl
collectionPublic // boolean
memberSince      // auto from createdAt
```

---

## Phase 0 — Migration: Vite → Next.js

**Do this first, before anything else. All features build on this foundation.**

### Why Next.js

- File-based routing needed for `/profile/[username]`, `/games/[id]`, `/listings/[id]`
- Server-side rendering for SEO on public game and profile pages
- Next.js Image component for optimized image loading
- API routes replace any need for early Cloud Functions
- Better Vercel deployment story

### Migration Tasks

- [x] **Init Next.js project** (JavaScript, Bulma — not TypeScript/Tailwind)
  ```bash
  npx create-next-app@latest retroera --js --no-tailwind --app --src-dir
  ```
- [x] Port Firebase config — `src/lib/firebase.js`
- [ ] Port all existing pages from Vite routes to Next.js app/ directory
  - `app/page.jsx` — home redirect
  - [x] `app/(app)/collection/page.jsx` — my collection
  - [ ] `app/(app)/browse/page.jsx` — game browser
  - [ ] `app/(app)/games/[igdbId]/[platformId]/page.jsx` — game detail
  - [ ] `app/(app)/copies/[id]/page.jsx` — copy detail
  - [ ] `app/(app)/settings/page.jsx` — account settings
- [x] Auth — `src/context/AuthContext.jsx`
- [x] Route groups — `(app)` for authenticated routes (marketing/landing deferred)
- [ ] Middleware — create middleware.js for auth-protected route redirects
- [x] Environment variables — `.env.local` with `NEXT_PUBLIC_` prefix
- [x] Styling — Bulma + `src/index.css` retained (Tailwind not used)
- [ ] Deploy to Vercel — connect repo, confirm production build passes
- [ ] Smoke test — verify all existing features work: browse, add to collection, upload photos

**Estimate:** 1-2 days. Do not proceed to Phase 1 until this is green.

### Done When

- All existing Vite features work in Next.js
- Production build passes on Vercel

---

## Phase 1 — Public Profiles & Collections

**Theme:** RetroEra finally has people, not just anonymous copy owners.

**Goal:** `retroera.app/profile/tristan` is a real, shareable page.

### 1.1 — Username System

- [ ] Add username field to Firestore users document
- [ ] Username must be lowercase, alphanumeric + underscores, 3-20 chars
- [ ] On first login / onboarding: prompt user to claim username if not set
- [ ] Validate username uniqueness on input (debounced Firestore check)
- [ ] Store username in both `users/{uid}` and a separate `usernames/{username}` lookup doc (for uniqueness enforcement)
- [ ] Create `/profile/[username]/page.tsx` — public route, no auth required
- [ ] Redirect `/profile` (no username) to the logged-in user's own profile

### 1.2 — Public Profile Page (`/profile/[username]`)

Display the following sections:

**Header**
- Avatar (upload or default generated initials avatar)
- Display Name
- Username (@tristan)
- Location (if provided, city/state only)
- Bio (max 160 characters)
- Member Since date
- Favorite Console + Favorite Game (badges)

**Collection Stats Bar**
- Total games owned
- Number of consoles represented
- Estimated collection value (sum of all public copies)
- Number of active marketplace listings

**Public Collection**
- Tabbed or filtered by console: NES | SNES | Genesis | PS1 | N64 | GBA | etc.
- Grid of game covers with condition badge
- Clicking a copy goes to public copy detail view
- If collection is private: show "This collection is private."
- Empty state: "No games in collection yet."

**Active Listings section** (placeholder if marketplace not done yet)
- "No active listings." — renders safely even before Phase 2

### 1.3 — Profile Editing (`/settings/profile`)

- [ ] Edit Display Name
- [ ] Edit Username (with availability check)
- [ ] Edit Bio (160 char limit with counter)
- [ ] Edit Location (city, state — optional)
- [ ] Edit Favorite Console (dropdown of supported consoles)
- [ ] Edit Favorite Game (free text or IGDB search)
- [ ] Avatar upload (Firebase Storage, same pattern as copy photos)
- [ ] Collection visibility toggle: Public / Private
- [ ] Save button with loading + success state

### 1.4 — Link Usernames Throughout the App

Anywhere a user's name currently appears, make it a link to their profile.

- [ ] Community Copies rail on game pages — each copy owner name is now a link
- [ ] Activity feeds (future) — username links
- [ ] Marketplace listings (future) — seller name links

### 1.5 — Stretch Goals (only if time allows)

- [ ] "Share Collection" button that copies `retroera.app/profile/[username]` to clipboard
- [ ] Basic "Newest Members" list on a `/community` page (just a grid of recent signups)

### Done When

- Every user has a public profile URL
- Profile shows real collection stats
- Profile is fully shareable (no login required to view)
- Profile editing is working with username claim
- Community copy owners are linked to their profiles

---

## Phase 2 — Marketplace Beta

**Theme:** Listings are tiny. Ship them.

**Goal:** A collector can list a game. A buyer can find it. They can make contact.

Validate demand before touching money. Important framing: This is NOT "a marketplace." It's Marketplace Beta. The UI should communicate that contact happens off-platform for now.

The marketplace browse experience must stay **separate from community showcase copies** — same underlying copy record, different presentation and intent.

### 2.1 — Firestore Setup

- [ ] Create `listings/{listingId}` collection in Firestore, linked to `copyId`
- [ ] Define listing schema per data model above (`sellerId`, `copyId`, price, currency, description, status, timestamps)
- [ ] Validate on create/update that the referenced copy exists and belongs to the seller
- [ ] Set Firestore security rules:
  - Anyone can read listings where `status == "active"`
  - Only `sellerId == request.auth.uid` can create/update/delete
- [ ] Create Firestore composite index: `status + createdAt` (for marketplace feed)
- [ ] Create Firestore composite index: `sellerId + status` (for seller dashboard)
- [ ] Create `listingService` (use `copyService` as the pattern — in `lib/firestore/listings.ts` after Next.js migration)

### 2.2 — List For Sale (inside Copy Detail)

- [ ] Add "List For Sale" option to copy detail page action menu (...)
- [ ] Only visible to the copy owner
- [ ] Opens a drawer / modal:
  - Price input (USD, required)
  - Description textarea (optional, max 500 chars)
  - Condition shown (read-only, pulled from copy)
  - Photos shown (read-only, pulled from copy)
  - Submit creates a listings document with `status: "active"`
- [ ] After listing, copy detail shows a "Listed for $XX" badge
- [ ] Show price and sale status on copy cards throughout the app when an active listing exists
- [ ] Copy owner can "Remove Listing" from the same menu (sets `status: "removed"`)
- [ ] Prevent copy deletion or incompatible edits (condition, photos) while actively listed
- [ ] Require stronger condition descriptions and photographs for listings than casual collection entries (use listing description + inherited copy photos)

### 2.3 — Marketplace Page (`/marketplace`)

- [ ] Fetch all listings where `status == "active"`, ordered by `createdAt desc`
- [ ] Display as a card grid:
  - Game cover image
  - Game title
  - Console
  - Condition badge
  - Price
  - Seller username (linked to profile)
  - Listed date ("3 days ago")
- [ ] Filter bar:
  - Console (NES, SNES, Genesis, PS1, N64, GBA, Dreamcast, etc.)
  - Condition (Mint, Excellent, Good, Fair, Poor)
  - Price range (min / max inputs)
  - Sort: Newest | Price Low-High | Price High-Low
- [ ] Search bar: filter by game title
- [ ] Empty state: "No listings found. Try adjusting your filters."
- [ ] Add "Marketplace" to main navigation

### 2.4 — Listing Detail Page (`/listings/[listingId]`)

- [ ] Game cover + title + console
- [ ] Condition badge (Mint, Excellent, etc.)
- [ ] Price (large, prominent)
- [ ] Photo gallery (inherited from copy)
- [ ] Seller info:
  - Avatar
  - Username (linked to profile)
  - Member since
  - Number of active listings
- [ ] Description
- [ ] "Contact Seller" button:
  - Requires login to see seller contact method
  - Option A (simpler): reveals seller's email
  - Option B (better UX): opens a pre-filled mailto link
  - Note in UI: "RetroEra does not process payments. Buyers and sellers arrange payment directly."
- [ ] "Report Listing" link (basic — can just be a mailto to you for now)
- [ ] If listing `status == "sold"`: show "This item has been sold." banner

### 2.5 — Game Page: Add Marketplace Listings Section

On the existing game detail page (`/games/[id]`), add a new section below Community Copies:

**Before (today):**
```
Community Copies
[John | Mint | Photo]
[Sarah | Excellent | Photo]
```

**After (Phase 2):**
```
Community Copies
[John | Mint | Photo]
[Sarah | Excellent | Photo]

Marketplace Listings
[John | Mint | $84 | View Listing]
[Mike | Good | $45 | View Listing]
```

- [ ] Query active listings where `igdbGameId` matches current game
- [ ] Render listing cards inline
- [ ] Link to listing detail page
- [ ] Empty state: "Nobody is selling this game yet. Be the first to list one."

### 2.6 — Seller Dashboard (`/dashboard/listings`)

- [ ] Accessible from user menu / settings
- [ ] Three tabs: Active | Sold | Drafts (drafts can be empty for now)
- [ ] Active listings: price, game, date listed, "Mark as Sold" button, "Remove" button
- [ ] Sold listings: price, game, date sold (read-only)
- [ ] "Mark as Sold" updates `status: "sold"` and hides from public marketplace
- [ ] Empty state for each tab

### 2.7 — Terms & QA

- [ ] Draft seller rules and marketplace terms (lightweight — contact-based beta, no payments)
- [ ] Add marketplace test cases to the QA checklist (`QA_COMMUNITY_COPIES.md` or dedicated marketplace QA doc)

### Done When

- A user can list a copy for sale in under 60 seconds
- Marketplace page shows all active listings with working filters, separate from community copies
- Listing detail page shows full info + contact method
- Game pages show marketplace listings inline
- Seller can mark items as sold from their dashboard
- Active listings block destructive copy edits
- Marketplace QA cases are documented and passing

---

## Phase 3 — Community & Discovery

**Theme:** RetroEra starts feeling alive.

**Goal:** A visitor who isn't logged in can feel the energy of the collector community.

### 3.1 — Activity Feed (`/community` or homepage section)

Show a chronological feed of recent platform activity.

- [ ] Create an `activity` Firestore collection (or derive from existing data)
- [ ] Log events:
  - User added a game to collection
  - User listed a game for sale
  - New member joined
- [ ] Activity card format:
  - Avatar + username
  - Action text: "added Chrono Trigger to their collection"
  - Game cover thumbnail
  - Console + condition badge
  - Time ago ("2 hours ago")
- [ ] Feed is public (no login required)
- [ ] Limit to 50 most recent events
- [ ] Refresh on page load (no real-time required yet)

### 3.2 — Community Discovery Page (`/community`)

- [ ] Recent Activity feed (from 3.1)
- [ ] Newest Members (grid of recent signups: avatar + username + member since)
- [ ] Newest Listings (3-4 most recent marketplace listings)
- [ ] Most collected games this month (if query is cheap enough)

### 3.3 — Search Improvements

Extend existing search to cover more entity types.

- [ ] Search users by username or display name
  - Results show: avatar, username, collection size
  - Links to profile
- [ ] Search marketplace listings by game title
  - Results show: cover, title, price, condition
  - Links to listing detail
- [ ] Unified search results page with tabs: Games | Users | Listings
- [ ] URL-based search (`/search?q=chrono+trigger&tab=listings`)

### 3.4 — Follow Collectors (Lightweight)

- [ ] "Follow" button on public profile pages
- [ ] Store follows in `follows/{followerId_followedId}` documents
- [ ] Show follower / following counts on profile
- [ ] "Following" tab in activity feed: filter to only show people you follow
- [ ] No notifications required yet

### 3.5 — Polish Pass (ongoing through Phase 3)

- [ ] All empty states are meaningful, not just "No data"
  - "Nobody owns this game yet. Be the first to add it."
  - "This collector's collection is private."
  - "No active listings for this game yet."
- [ ] All loading states have skeletons (not just spinners)
- [ ] All error states are handled gracefully
- [ ] Console filter works consistently across: Collection, Marketplace, Community
- [ ] Confirm all pages are accessible without login (browse, game detail, profile, marketplace)

### Done When

- Activity feed is live and shows real events
- Community page exists and feels populated
- Search covers games, users, and listings
- Follow system is functional
- All empty and loading states are polished

---

## Phase 4 — Polish & Launch Readiness

**Theme:** Stop building. Start polishing.

**Rule:** No new features in this phase. Every hour goes to making existing features feel production-quality.

### 4.1 — Mobile Polish (HIGHEST PRIORITY)

Most visitors will use their phone.

- [ ] Audit every page on iPhone SE (375px wide) — the smallest common viewport
- [ ] Audit every page on a standard Android (390px)
- [ ] Fix any text overflow, button clipping, or layout breaks
- [ ] Navigation: confirm mobile nav is thumb-friendly
- [ ] Photo upload: confirm it works from mobile camera
- [ ] Marketplace cards: ensure they're readable and tappable on mobile
- [ ] Profile page: looks great on mobile
- [ ] Game detail page: community copies and listings are readable
- [ ] Touch targets: all buttons/links at least 44x44px

### 4.2 — Performance

- [ ] Implement Next.js Image component everywhere (replaces `<img>` tags)
- [ ] Add loading skeletons to: marketplace page, profile page, game detail, community feed
- [ ] Firestore pagination: marketplace and community feed use `startAfter` cursor pagination
- [ ] Firestore queries: confirm all queries hit indexes (check Firestore console for warnings)
- [ ] Lighthouse score target: 80+ on mobile for landing page

### 4.3 — Landing Page (`/`)

This is what someone sees when they scan a QR code or follow a link. It must be exceptional.

- [ ] Hero section:
  - Tagline: "Catalog. Collect. Discover. Buy & Sell Retro Games."
  - Sub-tagline: "The best place to catalog your retro game collection and connect with other collectors."
  - Primary CTA: "Start Your Collection — Free"
  - Secondary CTA: "Browse Games"
  - Hero visual: screenshot or mockup of the collection UI
- [ ] Features section (4 cards):
  - Collection Tracking: "Every copy, every condition, every photo."
  - Game Database: "Powered by IGDB. Thousands of titles across every retro console."
  - Collector Profiles: "Share your collection. Discover others."
  - Marketplace Beta: "See what collectors are selling. Contact them directly."
- [ ] Social proof section: "X games cataloged. Y collectors. Z active listings." (real numbers from Firestore)
- [ ] FAQ section (3-5 questions):
  - "Is RetroEra free?" — Yes, free to catalog and browse. Marketplace is free to list.
  - "How does buying work?" — Buyers contact sellers directly. RetroEra facilitates discovery.
  - "What consoles are supported?" — All of them. Powered by IGDB.
  - "Can I keep my collection private?" — Yes. You control visibility per copy or for your whole collection.
- [ ] Footer: logo, tagline, links (Browse, Marketplace, Community, Sign Up)
- [ ] The page works perfectly without JavaScript (SSR)

### 4.4 — Database Seeding (Demo Prep)

The marketplace cannot look empty when you show it to someone.

- [ ] Create 15-20 realistic marketplace listings using your own games or with permission
- [ ] Ensure listings cover multiple consoles: SNES, NES, Genesis, PS1, N64, GBA, Dreamcast
- [ ] Ensure listings have real photos (your own game photos)
- [ ] Create 2-3 "demo" public profiles that look like real collectors
  - Each profile should have 20-50 games in their public collection
  - Mix of common and rare titles
- [ ] Verify Chrono Trigger, EarthBound, Metal Gear Solid have community copies visible

### 4.5 — QR Code & Promo Materials

- [ ] Generate QR code pointing to retroera.app (or `/signup` with UTM params)
- [ ] UTM params: `?utm_source=event&utm_medium=print&utm_campaign=retroera-launch`
- [ ] Design a simple business card or flyer:
  - RetroEra logo
  - Tagline
  - QR code
  - "Free to join. Catalog your collection today."
- [ ] Prepare a "demo script" (see below)

### 4.6 — Analytics Setup

Know what's happening in real time.

- [ ] Add Vercel Analytics (one line install, free tier)
- [ ] Add custom event tracking:
  - `signup_completed`
  - `game_added_to_collection`
  - `listing_created`
  - `listing_viewed`
  - `contact_seller_clicked`
  - `profile_viewed`
- [ ] Create a simple `/admin/stats` page (auth-protected to your account only):
  - Total users
  - Total copies
  - Total public copies
  - Total active listings
  - Signups today / this week

### Done When

- Every page feels polished on mobile
- Landing page is live and compelling
- Database has real, populated listings and collections
- QR code generates and links correctly with UTM tracking
- Demo script is practiced and under 2 minutes
- Analytics are tracking key events

---

## Demo Script (Practice This)

**Duration:** 90 seconds. Repeatable.

1. Open retroera.app — show landing page briefly
2. Navigate to Browse — search "Chrono Trigger"
3. Open the game page — show IGDB data, community copies
4. Tap a collector's name — open their public profile
5. Show their collection stats and game grid
6. Go back — show Marketplace tab
7. Show a listing: photo, condition, price, Contact Seller
8. Say: "This is what we're building. Full checkout is coming. For now, buyers and sellers connect directly."
9. Hand them your phone — let them search their favorite game
10. Hand them a card with the QR code

---

## Stretch Goals (After MVP)

Only if all primary phases are complete.

- [ ] "Make Offer" flow: buyer taps button on a copy, owner gets notified (email only), they exchange contact info — no money changes hands through RetroEra
- [ ] Transaction history: after marking as sold, seller can log final sale price for collection value history
- [ ] Price History section on game pages: aggregate sold listing prices from RetroEra's own data
- [ ] Email notifications via Resend or SendGrid: "Someone viewed your listing" or "New game listed: Chrono Trigger"
- [ ] Collector leaderboard: top collectors by collection size, value, rarity score

---

## File & Folder Structure Reference (Next.js App Router)

```
src/
  app/
    (marketing)/
      page.tsx                    -- landing page
      layout.tsx
    (app)/
      layout.tsx                  -- authenticated shell with nav
      browse/
        page.tsx
      games/
        [id]/
          page.tsx
      collection/
        page.tsx
      copies/
        [id]/
          page.tsx
      marketplace/
        page.tsx
        [listingId]/
          page.tsx
      profile/
        [username]/
          page.tsx
      community/
        page.tsx
      search/
        page.tsx
      dashboard/
        listings/
          page.tsx
      settings/
        profile/
          page.tsx
    api/                          -- Next.js API routes if needed
  components/
    ui/                           -- shared primitives
    game/                         -- GameCard, GameCover, etc.
    copy/                         -- CopyCard, CopyDetail, etc.
    listing/                      -- ListingCard, ListingDetail, etc.
    profile/                      -- ProfileHeader, CollectionGrid, etc.
    marketplace/                  -- MarketplaceFilters, ListingGrid, etc.
    community/                    -- ActivityFeed, MemberCard, etc.
    layout/                       -- Nav, Footer, Sidebar, etc.
  lib/
    firebase.ts
    firestore/
      users.ts
      copies.ts
      listings.ts
      activity.ts
    utils.ts
  context/
    AuthContext.tsx
  hooks/
    useAuth.ts
    useCollection.ts
    useListings.ts
  types/
    index.ts                      -- all TypeScript interfaces
  middleware.ts
```

---

## Firestore Security Rules Checklist

Review and update rules for new collections:

- `users/{uid}` — read: any, write: owner only
- `usernames/{username}` — read: any, write: server/owner only
- `copies/{copyId}` — read: any if public, write: owner only
- `listings/{listingId}` — read: any if status==active, write: owner only
- `follows/{id}` — read: any, write: follower only
- `activity/{id}` — read: any, write: server only (or via client with rate limiting)

---

## Phase Check-In Questions

Ask yourself at the end of each phase:

- **Phase 1:** Can I share a URL of my collection with someone who has never heard of RetroEra, and have them immediately understand what they're looking at?
- **Phase 2:** Can a collector list a game in under 60 seconds, and can a buyer find it and contact the seller without confusion?
- **Phase 3:** Does the platform feel like a community, or does it feel like a database?
- **Phase 4:** If I handed my phone to a stranger right now, would I be proud or embarrassed?

---

## Post-MVP Roadmap

Everything below is **v2+**. Do not start until MVP (Phases 0–4) is complete.

References: [Stripe Connect marketplaces](https://docs.stripe.com/connect/marketplace) · [Application fees](https://docs.stripe.com/connect/marketplace/tasks/app-fees) · [Merchant of record](https://docs.stripe.com/connect/merchant-of-record)

### Phase 5 — Payments (controlled launch)

Use Stripe Connect, fixed-price checkout, and an invite-only group of trusted sellers.

#### Seller onboarding

- [ ] Choose a Stripe Connect account configuration; Stripe-hosted onboarding is preferred for v1
- [ ] Add a trusted backend using Firebase Admin and the Stripe SDK
- [ ] Create an endpoint that creates connected accounts and onboarding links
- [ ] Store Stripe seller state privately, including account ID and payout readiness
- [ ] Add a "Start selling" onboarding flow
- [ ] Require completed onboarding before a seller can activate a listing

#### Checkout

- [ ] Create Stripe Checkout Sessions exclusively on the server
- [ ] Never trust the browser for price, platform fee, seller, or destination account
- [ ] Collect RetroEra's commission using an application fee
- [ ] Decide between destination charges and separate charges and transfers
- [ ] Do not describe delayed transfers as escrow without legal advice
- [ ] Treat signed Stripe webhooks as the source of payment truth
- [ ] Handle successful payments, refunds, disputes, and failed payments
- [ ] Make webhook processing idempotent
- [ ] Reserve listings atomically before checkout (`status: "reserved"`)
- [ ] Release reservations after checkout expiration or failure

#### Orders

- [ ] Add `orders/{orderId}` records
- [ ] Store immutable buyer, seller, listing, price, fee, and Stripe snapshots
- [ ] Track payment, shipping, refund, and dispute states
- [ ] Add buyer order confirmation and seller sale notification
- [ ] Let sellers enter tracking for manually purchased labels
- [ ] Provide admin-operated cancellations and refunds for v1
- [ ] Decide when seller funds become available based on shipment or delivery

#### Initial launch constraints

- [ ] US buyers and sellers only
- [ ] Fixed-price "Buy now" only
- [ ] One item and one seller per checkout
- [ ] Tracked shipping required
- [ ] Sellers must be at least 18
- [ ] Invite-only trusted seller group
- [ ] No offers, carts, trades, auctions, or international transactions

#### Fee model

Target a sustainable margin after payment, payout, support, refund, and fraud costs.

- [ ] Model a 10% seller fee with a $1 minimum
- [ ] Compare an 8% seller fee plus a buyer-protection fee
- [ ] Model profitability for low-value orders, especially a $20 transaction
- [ ] Include card processing, Connect, payout, refund, and dispute costs
- [ ] Confirm current Stripe pricing and Connect configuration before publishing fees

Draft assumptions — not final pricing:

- Card processing: approximately 2.9% + 30¢ for a US card transaction
- Connect pricing can include monthly active-account and payout fees when the platform controls pricing
- Chargebacks and non-refundable processing costs require a reserve in the model

Example money flow:

1. A buyer pays $50 through Stripe Checkout.
2. Stripe routes the seller's share to their connected account.
3. RetroEra retains an application fee, such as $5.
4. Stripe deducts applicable processing and Connect fees.
5. The seller receives the remaining funds through Stripe payouts.

Illustrative server-side PaymentIntent fields:

```js
{
  amount: 5000,
  currency: "usd",
  application_fee_amount: 500,
  transfer_data: {
    destination: sellerStripeAccountId,
  },
}
```

### Phase 6 — Trust & Operations

Scale only after the basic buy → ship → complete lifecycle is reliable.

- [ ] Show transaction history on profiles where appropriate
- [ ] Add seller reviews and reputation
- [ ] Integrate shipping labels through Shippo or EasyPost
- [ ] Add delivery tracking
- [ ] Add seller performance controls and suspensions
- [ ] Evaluate Stripe Radar for Platforms
- [ ] Build a moderation dashboard for listings and reports
- [ ] Transfer copy ownership after a completed sale through trusted server code
- [ ] Add offers only after fixed-price purchases are stable
- [ ] Consider multi-item checkout much later

### Infrastructure (payments era)

- [ ] Add a trusted server layer for payments, fee logic, and ownership transfer
- [ ] Verify Firebase ID tokens on every marketplace endpoint
- [ ] Host the Express backend in production or migrate marketplace logic to Cloud Functions
- [ ] Update backend and Storage CORS for production origins
- [ ] Add automated Firestore rules and payment-flow tests
- [ ] Add monitoring and alerts for webhook failures

### Legal & compliance

Consult an accountant and small-business attorney before processing real transactions.

- [ ] Marketplace terms of service
- [ ] Seller agreement
- [ ] Refund and dispute policy
- [ ] Buyer protection policy
- [ ] Merchant-of-record analysis
- [ ] Sales-tax and marketplace-facilitator analysis
- [ ] Evaluate Stripe Tax
- [ ] Determine seller 1099 reporting responsibilities
- [ ] Prohibited-items policy covering counterfeits, reproductions, and stolen goods
- [ ] Update the privacy policy for payment and shipping data

### Other v2 features (no specific phase yet)

- Email notification system (Resend or SendGrid)
- Native iOS / Android app
- Full admin dashboard (beyond MVP `/admin/stats`)
- Automated price suggestions via PriceCharting API
- Collection insurance value reports
- Want list / wishlist feature
- Trade offers (game-for-game swaps)
- Physical consoles as first-class collection items

### Out of scope (indefinitely)

- Digital game downloads
- Virtual items or in-game currency
- Auctions and bidding
- Peer-to-peer transfers unrelated to purchases
- eBay integration

---

## Notes on Structure

**The migration section is first** and intentionally marked as a prerequisite. Don't start Phase 1 tasks until Next.js is fully working — otherwise you'll be porting and building at the same time and debugging the wrong things.

**Each phase has a "Done When" checklist** so you have clear acceptance criteria to paste into Cursor as context before each session. Something like: *"Here are my Phase 2 done criteria — generate the Firestore security rules for the listings collection."*

**The demo script is baked in** because the 90-second flow matters more than any individual feature. Practice it until it's automatic.

**The file structure section** gives Cursor exactly the architecture context it needs to generate code that fits your project rather than starting from scratch every session. Paste it at the top of any Cursor conversation about routing or new pages.

---

Last updated: September 2025
Goal: MVP — demo-complete collector platform with marketplace beta
Strategy: Collectors first. Marketplace second. Stripe third.
