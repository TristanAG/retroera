# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created project `README.md` documenting current functionality, architecture, and scope.
- Added `.nvmrc` (Node 20) and `engines.node >= 18` in root and server `package.json` to align with Vite 6 and Express 5 requirements.
- Added canonical `copies` records with stable IGDB game/platform identity and support for multiple physical copies of the same release.
- Added owner-private copy metadata so estimated collection values are not exposed with public copies.
- Added Firebase Storage photo uploads with five-photo limits, ordering, primary previews, upload progress, client-side resizing, WebP compression, orientation correction, and EXIF/GPS removal.
- Added private-by-default and public copy visibility controls to add and edit flows.
- Added public display-name profiles as the foundation for the social layer without exposing authentication email addresses.
- Added physical-copy thumbnails to collection views and owner-copy cards to game pages.
- Added a responsive community-copy rail showing public copies for the exact IGDB game and platform.
- Added read-only public copy detail views with complete photo galleries and an explicit “Not currently for sale” state.
- Added public-copy reporting records and an initial report interface for administrative moderation.
- Added version-controlled Firestore rules, Storage rules, composite indexes, emulator configuration, and Storage CORS configuration.
- Added `QA_COMMUNITY_COPIES.md` with migration, security, image, accessibility, regression, documentation, and deployment verification checklists.

### Changed
- Game detail page now surfaces IGDB proxy error messages instead of a generic "Could not load game data" failure.
- Copy photo uploads now accept iPhone HEIC/HEIF files and convert them client-side before compression and Storage upload.
- Replaced active collection CRUD and console-subcollection subscriptions with one canonical top-level copy source and owner-private value records.
- Updated game pages to manage each owned copy independently and offer “Add another copy.”
- Updated navigation to expose the public profile editor and stop displaying authenticated email addresses.
- Updated ESLint configuration for the project’s JavaScript prop conventions and Node server globals.
- Reworked `README.md` to reflect the current collection, photo, visibility, social foundation, Firebase architecture, migration behavior, security model, and future marketplace scope.

### Migration
- Added an idempotent, bounded legacy migration from `users/{uid}/games` into canonical copies and owner-private metadata.
- Added deterministic migrated copy IDs, progress tracking, source mapping errors, and safe reruns.
- Legacy collection documents are retained for rollback and are no longer written by active collection flows.

### Security
- Public copy documents contain only community-safe fields; private estimated values remain owner-only.
- New copies remain private drafts until all selected photos and metadata have been saved.
- Firestore rules enforce immutable copy ownership, valid visibility, profile field allowlists, report creation constraints, and a maximum of five photo paths.
- Storage rules restrict writes to owners and permit non-owner reads only for photos attached to public copies.
