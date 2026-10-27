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

- [x] Fetch the contribution calendar for every year since the account was created (2021) in one
      GraphQL request, using aliased yearly queries
      _2026-10-27: a cheap preliminary query fetches `user.createdAt` to determine the start
      year (robust for any account, not just one created in 2021); the actual calendar data is
      then one request with one aliased `year<N>: user(...) { contributionsCollection(...) }`
      block per year from account creation through the current year._
- [x] Calculate the current streak, longest streak and all-time total
      _`calculateStreaks` in `src/utils.ts`: a trailing zero-contribution day (today, not over
      yet) is skipped once so it doesn't zero out an otherwise-live streak; everything else
      scans the merged, chronologically-ordered day list directly, so a gap or a continuation
      at a year boundary falls out of the same logic with no special-casing._
- [x] `GET /streak` renders an SVG card using the existing themes and colour params
      _New `streakSvg` in `src/svgs.ts`, wired through `Utilities.buildStreakCard`,
      `Handlers.getStreak` and the `/streak` route in `src/main.ts`. Reuses `queryOptions()`'s
      theme/color/radius/title resolution; the three-column stat layout is fixed-size rather
      than following the line graph's `height` param, since that range was sized for a chart._
- [x] Tests for the streak maths, including today having no contributions yet and gaps that
      cross a year boundary
      _New `__test__/streak.test.ts`: `calculateStreaks` unit tests for today-incomplete,
      a genuine break, a streak and a gap each crossing Dec31/Jan1, and an empty history;
      `streakSvg` rendering checks; and `Fetcher.fetchStreakData` tests mocking the two-request
      flow (createdAt, then the aliased yearly query) plus the invalid-username path._
- [x] README section for `/streak`
      _2026-10-27: `npm run build`, `npm run lint` and `npm test` all pass (37 tests; the one
      pre-existing failure is the live-API test in `__test__/utils.test.ts`, which needs a
      `TOKEN` - same documented gap as Phases 0 and 2, unrelated to this phase). The
      `createdAt` field and the aliased multi-year query follow GitHub's GraphQL schema but
      haven't been smoke-tested against the live API locally, since no `TOKEN` is set in this
      environment._

> **Decided:** keep a separate streak card on the profile, using the new self-hosted `/streak`
> endpoint. Wired up in Phase 6.

---

### Phase 4: Self-host the stats card

Repo: `KingRaver/github-readme-stats`

- [x] Deploy it as a second Vercel project with the same kind of narrow, read-only token
      _2026-10-27: there is no `count_private`-style parameter in this codebase. The stats
      card's total-commits count comes from `contributionsCollection.totalCommitContributions`
      over GraphQL (`src/fetchers/stats.js`), which GitHub includes private contributions in
      automatically when the token belongs to the user being queried — the same mechanism
      Phase 1 already confirmed for this repo. No code change needed; deploying with
      KingRaver's own token against username `KingRaver` should already count privately._
      _The Vercel project `github-readme-stats` under `jeff-visions-projects` has a `READY`
      production deployment (confirmed via the Vercel API), and `TOKEN` is set (confirmed by
      Jeff). Note: the token was added after that production deployment was built — Vercel
      only applies new/changed env vars to deployments created after the change, so a redeploy
      may be needed before the card actually has access to it._
- [x] Confirm the commit count is above the shared instance's 987
      _2026-10-27: self-hosted stats card shows 991 total commits (last year), above the shared
      instance's 987 — confirms private contributions are counting now that `TOKEN` is applied._
- [x] Accept that top-languages counts public repos only. Including private repos would mean
      giving the token access to their code.
      _2026-10-27: accepted — staying public-repos-only for top-languages._

---

### Phase 5: One base URL

Branch: `feat/stats-proxy`
**Depends on:** Phase 4

- [x] Add proxy routes to `vercel.json` for `/stats` and `/top-langs`, pointing at the stats
      project and placed before the `/(.*)` catch-all
      _2026-10-27: both routes point at `github-readme-stats-psi-lyart.vercel.app`, the stats
      project's stable production domain (from the Vercel API's `list_project_domains`, not
      the per-deployment hash URL). Checked first whether the project's
      `ssoProtection: "all_except_custom_domains"` setting would block a server-side proxy
      hitting a `.vercel.app` domain — it doesn't: `curl` against
      `/api?username=KingRaver` and `/api/top-langs?username=KingRaver` on that domain both
      returned `200` with the right content type, confirming the setting only gates
      per-deployment preview URLs, not the stable production alias. `npm run build`,
      `npm run lint` and `npm test` all pass (37 tests)._
- [x] Smoke-test both proxied routes on a preview deployment
      _2026-10-27: PR #8 merged to `main`; the `rho-azure` production deployment picked it up
      (`READY`, created right after the merge). `curl` against
      `https://github-readme-activity-graph-rho-azure.vercel.app/stats?username=KingRaver` and
      `/top-langs?username=KingRaver` both returned `200` with `content-type:
      image/svg+xml`, and the bodies are real stats/top-langs SVG cards (not error cards) —
      confirming the `vercel.json` rewrite reaches the stats project end-to-end._

> **Decided:** keep the `vercel.app` URLs. No custom domain purchase for this project.

---

### Phase 6: Update the profile README

Repo: `KingRaver/KingRaver`
**Depends on:** Phases 2–5

- [ ] Point every card at the new base URL
- [ ] Move the typing SVG from `readme-typing-svg.herokuapp.com` to `readme-typing-svg.demolab.com`
- [ ] Replace the third-party streak card (`github-readme-streak-stats-eight.vercel.app`) with
      the self-hosted `/streak` endpoint, per the Phase 3 decision
- [ ] Add a scheduled Substack "latest posts" workflow (`gautamkrishnar/blog-post-workflow`)
      next to the snake workflow

> **Decision required:** add uptime or usage badges for Veritus and Voucher.Social? Only with
> aggregate numbers the operators approve.
