# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2026-10-27]

### Added

- Optional `line_width` and `point_size` query params for customizing the graph line and point styling.

### Changed

- Migrated ESLint config to the ESLint 9 flat config format.
- Set an explicit `rootDir` in `tsconfig.json` to match `tsc`'s existing compiled output and silence the TS6 rootDir-inference warning.
