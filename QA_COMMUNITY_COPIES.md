# Community Copies QA Plan

Use this document after implementing the canonical copy, image upload, visibility, public profile, copy detail, and community rail features. Complete every applicable checkbox and record failures with reproduction steps before release.

## Test record

- Tester:
- Date:
- Branch/commit:
- Environment:
- Firebase project or emulator:
- Browsers/devices:
- Result: Pending

## Required test identities and data

- Account A: owns private and public copies and has a configured public display name.
- Account B: owns public copies of at least one game shared with Account A.
- Account C: has no profile name and exercises fallback identity behavior.
- A game owned on two different platforms.
- At least two physical copies of the same game and platform owned by one account.
- A legacy account with existing `users/{uid}/games` data.
- A legacy record whose console maps cleanly to an IGDB platform.
- A deliberately unsupported legacy console value for migration recovery testing.
- Valid JPEG, PNG, and WebP images.
- Oversized, unsupported, incorrectly oriented, and EXIF/GPS-bearing images.

## 1. Baseline and environment

- [ ] Install dependencies from a clean checkout without unexpected errors.
- [ ] Required Firebase environment variables are documented and load correctly.
- [ ] Firebase Storage is enabled for the test project.
- [ ] Firestore rules, Storage rules, and indexes deploy successfully.
- [ ] Firebase emulators start with the repository configuration.
- [ ] The application starts against emulators without writing to production.
- [ ] The production build completes successfully.
- [ ] Existing lint and automated test commands pass.
- [ ] Existing login, logout, IGDB search, explore, and game-detail behavior still works.

## 2. Automated Firebase rules verification

Run these cases in the Firebase Emulator Suite.

### Copy documents

- [ ] An authenticated owner can create a valid private draft copy.
- [ ] A copy cannot be created for a different `ownerId`.
- [ ] Ownership cannot be changed during update.
- [ ] An owner can read, update, and delete their private copy.
- [ ] Another authenticated user cannot read a private copy.
- [ ] An unauthenticated user cannot read private copies.
- [ ] Another authenticated user can read a public copy.
- [ ] Public-copy queries fail safely unless constrained to public visibility.
- [ ] Invalid visibility values are rejected.
- [ ] More than five photo paths are rejected.
- [ ] Invalid field types and unexpected privileged fields are rejected.
- [ ] Platform identity requires a valid `igdbId` and `igdbPlatformId`.

### Owner-private metadata

- [ ] Owners can create and read their own `copyPrivate` metadata.
- [ ] Another authenticated user cannot read or query owner-private metadata.
- [ ] Public visibility does not expose `estimatedValue`.
- [ ] Private metadata cannot be written under another user’s path.

### Public profiles

- [ ] A user can create and edit their own public profile.
- [ ] A user cannot edit another user’s profile.
- [ ] Only allowlisted public profile fields can be written.
- [ ] Email, auth tokens, and other private account fields are rejected.
- [ ] Public profiles can be read by users allowed to use the social layer.

### Storage

- [ ] Owners can upload supported images only to their own copy path.
- [ ] Uploading to another owner’s or unrelated copy’s path is rejected.
- [ ] Unsupported MIME types are rejected.
- [ ] Files above the configured maximum size are rejected.
- [ ] Owners can read their private copy images.
- [ ] Other users cannot read private copy images.
- [ ] Other users can read images belonging to public copies.
- [ ] Making a copy private prevents new non-owner image reads.
- [ ] Owners can delete their own images but not another user’s images.

### Moderation reports

- [ ] An authenticated user can submit a valid report for a public copy/photo.
- [ ] A reporter cannot impersonate another reporter.
- [ ] Users cannot read other users’ reports or administrative fields.
- [ ] Invalid target IDs and unsupported report reasons are rejected.

## 3. Legacy migration

- [ ] A user with no legacy games completes migration without errors.
- [ ] Every legacy flat game creates exactly one canonical copy.
- [ ] Duplicate physical copies of the same game/platform remain separate.
- [ ] Existing title, condition, console, IGDB identity, and estimated value migrate correctly.
- [ ] Estimated value is stored only in owner-private metadata.
- [ ] Known console labels map to the correct stable IGDB platform IDs.
- [ ] Unmapped console labels enter a visible recoverable state and are not silently assigned.
- [ ] Migration processes collections larger than one Firestore batch limit.
- [ ] Progress is persisted between batches.
- [ ] Interrupting migration does not mark it complete.
- [ ] Rerunning migration resumes safely without duplicate copies.
- [ ] Source and target counts are verified before completion is recorded.
- [ ] Individual failed records report actionable errors.
- [ ] Legacy records remain unchanged after migration.
- [ ] Active add/edit/delete operations no longer write duplicated legacy records.
- [ ] A migrated user’s collection totals and console filters match the pre-migration collection.

## 4. Public identity and social-layer foundation

- [ ] A new user is prompted to choose a public display name at the appropriate point.
- [ ] Display-name validation handles blank, overly long, and unsupported values.
- [ ] A valid display name saves and appears consistently on public copies.
- [ ] Editing a display name updates future profile displays.
- [ ] Accounts without a name use the documented neutral fallback.
- [ ] No screen, query response, or error message exposes another user’s email.
- [ ] Profiles remain usable as the foundation for future social pages without implying marketplace availability.

## 5. Adding copies

- [ ] A user can add a copy with no photos.
- [ ] A user can add one valid photo.
- [ ] A user can add five valid photos.
- [ ] A sixth photo is rejected with a clear message.
- [ ] JPEG, PNG, and WebP inputs are accepted.
- [ ] Unsupported file formats are rejected before upload.
- [ ] Oversized originals receive the expected validation or compression behavior.
- [ ] Preview images match the selected files.
- [ ] Photos can be removed before submission.
- [ ] Photos can be reordered before submission.
- [ ] The selected primary photo becomes the first/primary stored photo.
- [ ] Double submission is prevented while saving.
- [ ] Upload progress is visible and understandable.
- [ ] New copies default to Private.
- [ ] Choosing Public still creates a private draft during upload.
- [ ] A copy becomes public only after every required write and upload succeeds.
- [ ] A failed upload does not expose a partial public copy.
- [ ] Failed drafts and uploaded objects are rolled back or surfaced for retry.
- [ ] “Add another copy” creates a distinct copy ID for the same game/platform.

## 6. Image processing and lifecycle

- [ ] Large images are resized to the documented maximum dimensions.
- [ ] Compressed output remains visually acceptable.
- [ ] Portrait and rotated-camera images display with correct orientation.
- [ ] EXIF and GPS metadata are absent from processed uploads.
- [ ] Primary thumbnails use the processed image rather than the original file.
- [ ] Broken or unavailable images show an accessible fallback.
- [ ] Blob/object URLs are revoked when images unmount or change.
- [ ] Repeated gallery navigation does not cause obvious memory growth.
- [ ] Removing an image during edit removes its Storage object after metadata saves.
- [ ] Failed metadata updates do not prematurely delete existing images.
- [ ] Deleting a copy removes all associated Storage objects.
- [ ] Orphan cleanup/retry behavior works after a simulated deletion failure.
- [ ] Storage usage and expected per-copy size remain within documented limits.

## 7. Editing copies and visibility

- [ ] Condition and estimated value can be edited independently.
- [ ] Estimated-value changes remain owner-only.
- [ ] Existing photos load in their saved order.
- [ ] Users can add, remove, reorder, replace, and reprioritize photos.
- [ ] Editing never permits more than five final photos.
- [ ] Private-to-public changes expose the copy and its photos only after a complete save.
- [ ] Public-to-private changes remove the copy from new community queries immediately.
- [ ] Public-to-private changes prevent new non-owner image reads.
- [ ] The visibility control clearly explains what information becomes public.
- [ ] Editing one of several identical game copies does not change another copy.
- [ ] Deleting one of several identical game copies leaves the others intact.

## 8. Owner game-page behavior

- [ ] The game page identifies a parent using `igdbId + igdbPlatformId`.
- [ ] The same title on different platforms does not mix owned or community copies.
- [ ] All copies owned by the current user are shown separately.
- [ ] Each owned copy displays the correct condition, visibility, and primary photo.
- [ ] Edit and delete actions target the selected `copyId`.
- [ ] “Add another copy” preserves the selected game/platform identity.
- [ ] User photos are visually distinct from IGDB covers and screenshots.
- [ ] User photos work with keyboard and pointer lightbox navigation.

## 9. Community-copy rail

- [ ] The rail loads only public copies matching the exact game and platform.
- [ ] Private copies never appear.
- [ ] Copies from another platform never appear.
- [ ] All current-user copy IDs are excluded from the community section.
- [ ] Multiple public copies from the same community user remain distinct.
- [ ] Cards show primary photo, condition, and public display name.
- [ ] Cards do not show email or owner-private estimated values.
- [ ] “For sale” is not shown unless a future active listing exists.
- [ ] Empty state explains that no community copies are public.
- [ ] Loading, query failure, retry, and broken-image states work.
- [ ] Result limits and pagination/load-more behavior do not duplicate or skip copies.
- [ ] Desktop layout places the rail beside game content without crowding it.
- [ ] Tablet and mobile layouts stack the rail in the intended order.
- [ ] Rail controls and cards are keyboard accessible.
- [ ] Screen-reader labels identify cards and images meaningfully.

## 10. Read-only copy detail

- [ ] Clicking a rail card opens the correct copy detail.
- [ ] Direct navigation/state restoration handles a missing or deleted copy gracefully.
- [ ] Private copies cannot be opened by another user.
- [ ] Detail shows all public photos in the correct order.
- [ ] Detail shows owner display name, game, platform, and condition.
- [ ] Owner-private estimated value is absent.
- [ ] The page states “Not currently for sale” without offering transaction controls.
- [ ] Back navigation returns to the originating game page and preserves rail state where practical.
- [ ] Photo gallery and controls are keyboard and mobile accessible.

## 11. Reporting and administrative takedown

- [ ] A user can report a public copy or photo from its detail view.
- [ ] The report UI confirms submission without exposing internal moderation state.
- [ ] Duplicate submissions are handled according to the documented policy.
- [ ] The report records target copy/photo, reporter, reason, and timestamp.
- [ ] The documented administrative process can identify and remove reported content.
- [ ] Removing or privatizing reported content removes it from the rail and blocks new image reads.
- [ ] A deleted report target produces a safe moderation state rather than an application error.

## 12. Failure, concurrency, and recovery

- [ ] Losing connectivity during upload gives a recoverable error.
- [ ] Losing connectivity during migration resumes safely.
- [ ] Two tabs editing the same copy do not silently corrupt photo ordering or visibility.
- [ ] A copy deleted while its detail view is open produces a safe not-found state.
- [ ] A profile changed while a rail is open refreshes or becomes consistent on reload.
- [ ] Firestore permission failures produce user-safe messages without leaking rule internals.
- [ ] Storage permission failures do not leave the UI indefinitely loading.
- [ ] Retrying a completed action does not create duplicate copies or reports.

## 13. Regression checks

- [ ] Authentication remains functional.
- [ ] Adding a game from Explore still prepopulates the correct title and platform.
- [ ] Collection console filters still work.
- [ ] Collection value totals still include owner-private estimated values.
- [ ] Existing edit and delete navigation remains correct.
- [ ] IGDB cover, metadata, screenshots, and lightbox remain functional.
- [ ] PriceCharting links remain correct.
- [ ] Mobile navigation and existing collection views have no new layout regressions.

## 14. Documentation verification

- [ ] `CHANGELOG.md` documents every delivered user-facing and technical change under `Unreleased`.
- [ ] `README.md` accurately describes image upload, visibility, profiles, community copies, and copy detail.
- [ ] The README data model matches the implemented canonical and owner-private collections.
- [ ] The README Firebase setup includes Storage, rules, indexes, and emulator requirements.
- [ ] Image limits, accepted formats, visibility defaults, and public fields match implementation.
- [ ] Completed work has moved out of future-tense roadmap sections.
- [ ] Listings, offers, transactions, and “for sale” remain clearly identified as future work.
- [ ] The README retains its collection/social/marketplace product vision and overall tone.
- [ ] No stale user-scoped dual-write architecture is described as current behavior.

## 15. Post-deployment smoke test

- [ ] Production rules and indexes are the reviewed versions from the repository.
- [ ] Account A can add a private copy with photos.
- [ ] Account B cannot discover or load Account A’s private copy/photos.
- [ ] Account A can publish the copy.
- [ ] Account B sees it in the correct game/platform rail and can open its detail.
- [ ] Account A can make it private again and Account B loses new access.
- [ ] Account A can add a second copy without overwriting the first.
- [ ] A report can be submitted and located through the documented administrative process.
- [ ] Error monitoring and Firebase usage show no unexpected spikes.

## Sign-off

- Automated tests:
- Manual functional QA:
- Security/rules QA:
- Responsive/accessibility QA:
- Documentation review:
- Release approved by:
- Outstanding issues:
