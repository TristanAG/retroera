# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created project `README.md` documenting current functionality, architecture, and scope.
- Added `.nvmrc` (Node 20) and `engines.node >= 18` in root and server `package.json` to align with Vite 6 and Express 5 requirements.

### Changed
- Game detail page now surfaces IGDB proxy error messages instead of a generic "Could not load game data" failure.
