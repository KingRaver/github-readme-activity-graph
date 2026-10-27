# Profile Cards Plan

Self-host the cards on the [KingRaver profile README](https://github.com/KingRaver/KingRaver) and
add data that shows the full scale of the work. Most of it is private: in the 12 months to
2026-10-27, 5,851 of 6,988 contributions were private, and the shared stats card only shows 987
commits.

Target end state: **two Vercel projects behind one base URL.**

- **This project** (`github-readme-activity-graph`) serves `/graph`, `/streak`, and proxy routes
  to the stats project.
- **The stats project** (the `KingRaver/github-readme-stats` fork) serves the stats and
  top-languages cards.
- Both use the same narrow, read-only token.

Each phase is its own branch and PR.

---

### Phase 0: Finish line_width / point_size

Branch: `feat/phase-0-finish-line-width-point-size`. The code itself (commit 4d29da2) was already
merged to `main` in PR #1.

- [x] Add a `line_width` row to the README Customization table (number 1–10, default 4)
- [x] Add a `point_size` row to the README Customization table (number 1–30, default 10)
- [x] `npm test`, `npm run lint` and `npm run build` pass
      _2026-10-27: replaced the legacy `.eslintrc.js`, which ESLint 9 ignores, with a flat
      `eslint.config.js`. It keeps the same rules, ignores and Prettier setup. It drops
      `interface-name-prefix`, a rule that no longer exists in typescript-eslint v8. Removed the
      unused `catch` bindings in `src/handlers.ts`. Lint covers 10 files with 0 problems, and
      `--fix` changes nothing. Build passes. Tests pass 15/15 with `TOKEN` set._
      _The live-API test in `__test__/utils.test.ts` needs a `TOKEN`. CI supplies it from
      `secrets.TOKEN`; locally it fails with a 401 unless one is set._

**Done when:** shipped, and the `rho-azure` deployment renders `?line_width=` / `?point_size=`.

---

### Phase 1: Token

- [x] Check the `TOKEN` already set in the Vercel project. It is a fine-grained, read-only token
      scoped to one repo, which is narrow enough.
- [x] Confirm private contributions come through with it. On 2026-10-27, `/data` returned 374
      contributions over 31 days, against GitHub's 379 total, of which 365 were private.

---

### Phase 2: Activity graph data features

Branch: `feat/private-contributions`
**Depends on:** Phase 0

- [x] Fetch `restrictedContributionsCount` in the existing query
- [x] Opt-in "+N private" label for the selected window (`show_private=true`)
- [x] Opt-in year-over-year ghost line (`compare=year`): the same window from last year, fetched
      in the same request as an aliased query
      _2026-10-27: adds a `userPrevious: user(...)` alias plus `$FROM_PREV`/`$TO_PREV` variables
      only when `compare=year`. The fetched previous-year days are trimmed to the same length as
      the current window and rendered as a dashed, point-less "ghost" line
      (`.ct-series-ghost`)._
- [x] Optional 7-day moving average (`trend=true`)
      _Trailing average (`movingAverage` in `src/utils.ts`), partial window for the first 6 days;
      rendered as a dotted, point-less "trend" line (`.ct-series-trend`)._
- [x] Tests in `__test__/` for each new option
      _New `__test__/activityGraphFeatures.test.ts`: query-option parsing, `movingAverage`, the
      aliased GraphQL query shape, `Fetcher.fetchContributions` parsing of
      `restrictedContributionsCount`/`previousYearContributions`, and `Card.buildGraph` rendering
      (and correctly omitting) the overlay series and private label._
- [x] README Customization rows for each new option
      _2026-10-27: `npm run build`, `npm run lint` and `npm test` all pass (28 tests; the one
      pre-existing failure is the live-API test in `__test__/utils.test.ts`, which needs a
      `TOKEN` — same documented gap as Phase 0, unrelated to this phase). The
      `restrictedContributionsCount` field name and the aliased-query syntax follow GitHub's
      GraphQL schema but haven't been smoke-tested against the live API locally, since no
      `TOKEN` is set in this environment._

> **Note:** GitHub reports private contributions only as a total for the window. The daily counts
> already include them, unlabelled. A shaded per-day public/private split would need the
> paginated per-commit, per-PR lists, which cost far more API quota. The label is the planned
> version; per-day shading is out of scope unless its cost is measured first.

> **Decision required:** offer Phase 2 and 3 features upstream to
> `Ashutosh00710/github-readme-activity-graph`, or keep them fork-only? Proceeding fork-only
> unless told otherwise.

---

### Phase 3: /streak endpoint

Branch: `feat/streak-card`
**Depends on:** Phase 0

- [ ] Fetch the contribution calendar for every year since the account was created (2021) in one
      GraphQL request, using aliased yearly queries
- [ ] Calculate the current streak, longest streak and all-time total
- [ ] `GET /streak` renders an SVG card using the existing themes and colour params
- [ ] Tests for the streak maths, including today having no contributions yet and gaps that
      cross a year boundary
- [ ] README section for `/streak`

> **Decision required:** keep a separate streak card on the profile, or drop it and let the
> graph carry that story? Building the endpoint either way; the profile choice is made in
> Phase 6.

---

### Phase 4: Self-host the stats card

Repo: `KingRaver/github-readme-stats`

- [ ] Bring the fork up to date with `anuraghazra/github-readme-stats`
- [ ] Deploy it as a second Vercel project with the same kind of narrow, read-only token
- [ ] Turn on the private commit count (check the parameter name in the current code; probably
      `count_private`)
- [ ] Confirm the commit count is above the shared instance's 987
- [ ] Accept that top-languages counts public repos only. Including private repos would mean
      giving the token access to their code.

---

### Phase 5: One base URL

Branch: `feat/stats-proxy`
**Depends on:** Phase 4

- [ ] Add proxy routes to `vercel.json` for `/stats` and `/top-langs`, pointing at the stats
      project and placed before the `/(.*)` catch-all
- [ ] Smoke-test both proxied routes on a preview deployment

> **Decision required:** custom subdomain (e.g. `cards.vividvisions.quest`, which is a DNS
> change) or keep the `vercel.app` URLs? Ask before touching DNS.

---

### Phase 6: Update the profile README

Repo: `KingRaver/KingRaver`
**Depends on:** Phases 2–5

- [ ] Point every card at the new base URL
- [ ] Move the typing SVG from `readme-typing-svg.herokuapp.com` to `readme-typing-svg.demolab.com`
- [ ] Replace the third-party streak card (`github-readme-streak-stats-eight.vercel.app`) per the
      Phase 3 decision
- [ ] Add a scheduled Substack "latest posts" workflow (`gautamkrishnar/blog-post-workflow`)
      next to the snake workflow

> **Decision required:** add uptime or usage badges for Veritus and Voucher.Social? Only with
> aggregate numbers the operators approve.
