# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2026-10-28]

### Added

- `/substack-feed` route in `vercel.json`, proxying to `jeffspirlock.substack.com/feed`. Substack
  returns 403 to GitHub Actions runners, so the profile README's blog-post workflow can read the
  feed through this route instead.

## [2026-10-27]

### Added

- `restrictedContributionsCount` in the GraphQL query, plus three opt-in activity graph options:
  a "+N private" label (`show_private=true`), a year-over-year ghost line for the same window one
  year earlier (`compare=year`, fetched via an aliased query in the same request), and a 7-day
  moving average trend line (`trend=true`).
- Optional `line_width` and `point_size` query params for customizing the graph line and point styling.
- `GET /streak`: a card showing current streak, longest streak and all-time total contributions,
  computed from the full contribution history (one GraphQL request per account, aliased by year,
  from account creation through the current year). Reuses the existing theme and color params.
- `/stats` and `/top-langs` routes in `vercel.json`, proxying to the self-hosted
  `github-readme-stats` fork so both cards are served from this project's base URL.

### Changed

- Migrated ESLint config to the ESLint 9 flat config format.
- Set an explicit `rootDir` in `tsconfig.json` to match `tsc`'s existing compiled output and silence the TS6 rootDir-inference warning.
