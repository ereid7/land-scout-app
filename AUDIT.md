# Land Scout — Architecture Audit
> Generated 2026-03-11 | Reviewed both repos end-to-end

---

## Executive Summary

Two repos, one product. The scraping pipeline (`land-researcher`) and the UI (`land-scout-app`) are 90% built but neither is production-ready on its own. The core issues are: (1) a 2,400-line god-file in the scraper repo that makes AI agent delegation hard, (2) no tests in the Next.js app, (3) no CI/CD pipeline, (4) deployment is fully manual, (5) the scraper → DB write path is fragile (dual-write kludge, no queue, no retry). Everything below is fixable without a rewrite.

---

## Part 1 — land-researcher (Python scraper)

### 🔴 Critical Issues

#### 1.1 `land_scout_browser.py` is a 2,400-line god-file
**Problem:** `Database`, `LandScoutBrowser`, scoring, enrichment, dedup, HOA detection, CLI parsing, run metrics, circuit breaker, dedup, geocoding, notification, and the main entrypoint all live in one file. An AI agent asked to "fix the scoring" must read 2,400 lines to make a 5-line change.

**Fix:** Decompose into focused modules:
```
land_researcher/
  scraper/
    runner.py         — orchestration, retry, parallel execution
    scorer.py         — scoring logic extracted from LandScoutBrowser
    dedup.py          — deduplication logic
    enricher.py       — enrich_listing, enrich_all, enrich_spatial
    notifier.py       — smart_notify logic
  db/
    sqlite.py         — existing SQLite adapter (renamed from Database class)
    neon.py           — NeonAdapter (moved from scrapers/db_neon_adapter.py)
    adapter.py        — get_adapter() factory (already exists as scrapers/db_adapter.py)
  cli.py              — argparse entrypoint only (imports runner)
```

#### 1.2 DB class in `land_scout_browser.py` duplicates `scrapers/db_neon_adapter.py`
**Problem:** There are now TWO `Database`/SQLite classes — one at line 69 of `land_scout_browser.py` (the original) and one in `scrapers/db_neon_adapter.py` (`SQLiteAdapter`). They diverge over time.

**Fix:** Delete the inline `Database` class in `land_scout_browser.py`. Make `LandScoutBrowser.__init__` use `get_adapter()` exclusively for all DB writes. Single source of truth.

#### 1.3 `config.json` is git-ignored but critical
**Problem:** Scrapers won't run correctly without `config.json`. There's `config.example.json`, `config.sample.json`, `config_backup.json`, 6 state-specific override files — it's chaos. An AI agent running in a fresh clone has no clear answer for what config to use.

**Fix:**
- Commit one canonical `config.defaults.json` (the safe defaults, no secrets)
- Auto-merge with `config.json` (user overrides) at runtime — already partially done in `config.py`
- Add `scripts/setup.sh` that copies `config.defaults.json` → `config.json` on first run
- Document in `CLAUDE.md` which file to edit

#### 1.4 No structured logging / no machine-readable run output
**Problem:** Log output is a mix of `print()` and `logging.info()` scattered across 2,400 lines. An AI agent checking if a run succeeded must parse unstructured text.

**Fix:**
- `runner.py` returns a structured `RunResult` dataclass (already partially done with the dict return)
- Write `data/last_run.json` after every run with counts, errors, scraper-level results
- Add `--json` flag to CLI to output the RunResult as JSON to stdout

#### 1.5 Orphaned scripts and stale files pollute the root
**Problem:** Root has `check_db.py`, `check_email_alerts.py`, `check_new.py`, `comprehensive_test.py`, `comps_analysis.py`, `daily_digest.py`, `decompose.py`, `deep_enrich.py`, `deep_research.py`, `drive_time.py`, `lease_estimate.py`, `map_listings.py`, `smart_notify.py`, `db.py`, `land_scout_api.py` — most unused, all undocumented, all noise.

**Fix:** Move to `scripts/legacy/` or delete. Keep root clean: `cli.py`, `config.py`, `config.defaults.json`, `pyproject.toml`, `README.md`, `CLAUDE.md`.

---

### 🟡 Moderate Issues

#### 1.6 Scoring is hardcoded and opaque
The scoring function is buried inside `LandScoutBrowser` with magic numbers and county-specific bonuses as inline strings. No tests for it. Score of 100 means nothing without knowing the rubric.

**Fix:** Extract to `scraper/scorer.py` with a `SCORING_RUBRIC` dict and a `score_listing(listing) → int` pure function. Write unit tests against it.

#### 1.7 Circuit breaker threshold is not persisted across runs
The circuit breaker (5 consecutive zero-yield runs → disable) resets on every Python process restart. It only works if the same process handles 5 runs — which it never does in a cron job.

**Fix:** Persist circuit breaker state in the DB (`scraper_runs` table already tracks this). Add a `consecutive_zero_count` field to `scraper_config` table or derive it from `scraper_runs` at startup.

#### 1.8 No async scraping — parallel execution uses threads not async
`ThreadPoolExecutor` with Playwright is fragile (Playwright is not thread-safe by default). Currently works but will hit edge cases on high-concurrency runs.

**Fix:** Either use `asyncio` + `playwright.async_api` properly, or keep threads but enforce one Playwright browser per thread (already done). Document the constraint in `CLAUDE.md`.

#### 1.9 Enrichment is blocking and slow
`enrich_all()` and `enrich_spatial()` call external APIs synchronously (Nominatim, Overpass) with hardcoded sleep(1) between calls. This is fine for 50 listings but kills performance at scale.

**Fix:** Short-term: accept it, document the limit. Long-term: a background async enrichment queue.

#### 1.10 `discovery/` system is standalone and disconnected
The meta-agent discovery system (`discovery/discover.py`, `generate_scraper.py`) is genuinely useful but:
- Uses DuckDuckGo scraping (fragile, rate-limited)
- `generate_scraper.py` just prompts an LLM but the output is never auto-tested or auto-registered
- Evaluated candidates in `discovery/evaluated/` are never acted on

**Fix (for full AI-agent autonomy):** Wire `generate_scraper.py` output into a staging path: `scrapers/staging/` → run tests → auto-promote to `scrapers/states/` or `scrapers/national/` on pass. Document this flow in `CLAUDE.md`.

---

### 🟢 What's Good

- `scrapers/base.py` is clean — `BaseScraper`, `PlaywrightScraper`, `LandListing`, `extract_state()` are well-structured
- Per-scraper config via `DEFAULT_SCRAPER_CONFIG` + `config.json` override is excellent
- `geo_filter_states` as single source of truth is correct
- 117 passing tests, decent coverage of geo-filter, HOA, dedup, production hardening
- `CLAUDE.md` + `.claude/agents/` subagent system is well-designed for AI delegation
- Discovery system architecture is the right idea

---

## Part 2 — land-scout-app (Next.js)

### 🔴 Critical Issues

#### 2.1 Zero tests
**Problem:** Not a single test file exists in `land-scout-app`. The entire frontend, all API routes, all data transformation logic (`listing-helpers.ts`) — untested. An AI agent making any change has zero signal on whether it broke something.

**Fix:**
```
tests/
  api/
    listings.test.ts    — mock DB, assert filter logic
    stats.test.ts
    runs.test.ts
  lib/
    listing-helpers.test.ts  — pure function, easy to test
  components/
    Sidebar.test.tsx    — filter state changes
```
Use `vitest` + `@testing-library/react`. Add `test` script to `package.json`.

#### 2.2 No CI pipeline
**Problem:** Every commit to both repos is untested in CI. There's no `.github/workflows/`. An AI agent merging a fix has no automated check.

**Fix:** `.github/workflows/ci.yml` for both repos:
- `land-scout-app`: `npm run build` + `npm test`
- `land-researcher`: `uv run pytest tests/`
- Run on push + PR to main

#### 2.3 No deployment automation
**Problem:** Deployment to Vercel is fully manual. There's no `vercel.json`, no deploy script, no post-deploy verification. An AI agent can't deploy without human involvement.

**Fix:**
- Add `vercel.json` with env var references
- Add GitHub Action: on push to `main` → `vercel --prod` (using Vercel CLI + `VERCEL_TOKEN` secret)
- Add `scripts/deploy.sh` for manual deploys from the CLI

#### 2.4 Error boundaries missing — a single broken API call crashes the whole map
**Problem:** `useListings` and `useStats` hooks have no error boundaries. If the DB is down, the whole page goes blank.

**Fix:** Add React `ErrorBoundary` wrapping the map and sidebar. Show degraded state with last-known data or a "DB unavailable" banner instead of a blank page.

#### 2.5 `app/api/listings/route.ts` does not handle `ne` (not equal) correctly
**Problem:** The `noHoa` filter uses `or(isNull, eq('unknown'), eq('none'), eq('low'))` — this is correct but the old version had a broken `ne()` that caused runtime errors. The current version is correct but should be tested.

---

### 🟡 Moderate Issues

#### 2.6 API has no pagination — returns up to 1,200 listings in one response
The listings endpoint returns up to 1,200 GeoJSON features in a single JSON payload. At ~2KB/listing average that's ~2.4MB per map load. Browser will lag.

**Fix:** Add cursor-based pagination or add a `bbox` query param so the map only requests listings in the current viewport. Short-term: keep 500-listing cap and add a `count` endpoint to warn if results are clipped.

#### 2.7 Map style depends on Stadia Maps (requires API key for production)
`tiles.stadiamaps.com` is free for dev but requires an API key in production at scale. No key = throttling.

**Fix:** Add `NEXT_PUBLIC_STADIA_API_KEY` to `.env.local.example`. Fall back to `demotiles.maplibre.org` if not set.

#### 2.8 `drizzle.config.ts` reads `.env.local` via dotenv at config-load time
This means `drizzle-kit push` silently uses the wrong DB if `.env.local` is missing. The placeholder URL causes confusing "no changes detected" behavior (as we saw today).

**Fix:** Add a check: `if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required')`. Remove the placeholder fallback.

#### 2.9 Auth is scaffolded but not functional
`NeonAuthUIProvider` is in the layout, `/auth/` pages exist, `UserButton` is in the TopBar — but `NEON_AUTH_BASE_URL` is not configured and auth has never been tested end-to-end. The saved searches API returns 401 for all requests.

**Fix:** Either (a) configure Neon Auth properly with real credentials, or (b) add a feature flag `NEXT_PUBLIC_AUTH_ENABLED=false` that hides auth UI when not configured. Don't leave broken UI in production.

#### 2.10 `ScrapeBadge` calls `/api/scrape` with POST — no auth, no rate-limit, no idempotency
Anyone can POST to `/api/scrape` and trigger a webhook. There's no HMAC verification, no cooldown.

**Fix:** Add HMAC signature verification to the scrape endpoint. Add a 5-minute cooldown stored in the DB or a simple KV store.

---

### 🟢 What's Good

- Drizzle schema is well-designed — proper types, indexes, FK constraints
- `lib/listing-helpers.ts` is a clean pure-function module (easy to test)
- `lib/types.ts` re-exports DB types correctly — no type duplication
- `lib/db/index.ts` auto-routing (Neon vs local pg) is solid
- `docker-compose.yml` + migration script = zero-friction local setup
- `useListings` / `useStats` hooks are clean React patterns

---

## Part 3 — Cross-Cutting / AI-Agent Autonomy

### 🔴 Blockers for "zero human input" operation

#### 3.1 Scraper runs require a machine with Playwright installed
The cron job (`land_scout_morning`) runs on Evan's Mac mini. If it goes offline, scraping stops. There's no fallback.

**Fix:** Containerize the scraper:
```dockerfile
# Dockerfile in land-researcher/
FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy
WORKDIR /app
COPY . .
RUN pip install uv && uv sync
CMD ["uv", "run", "python", "cli.py", "--run-all"]
```
Deploy to: Railway, Render, or a $5/mo VPS. Triggered by GitHub Actions cron.

#### 3.2 No webhook/API for triggering scrape runs from the UI
The `/api/scrape` endpoint exists but just fires a webhook to an external URL. There's no way to trigger a real scrape run from the UI or from a Telegram message.

**Fix:** Add a `/api/scrape/trigger` endpoint that enqueues a scrape job. Use a simple Postgres-backed job queue (one table: `jobs` with `status`, `type`, `payload`, `created_at`). The scraper polls this queue.

#### 3.3 No notification pipeline
`smart_notify.py` exists in the scraper repo but it's disconnected from everything. New high-score listings never reach Telegram/email automatically.

**Fix:** After each scrape run, the notifier should:
1. Query listings `WHERE notified = false AND score >= 85 AND status = 'active'`
2. Send a Telegram message via the OpenClaw message tool (or direct bot API)
3. Mark `notified = true`

Wire this into `runner.py` as a post-run hook.

#### 3.4 No observability — can't tell if scrapers are drifting without manual inspection
Scraper health degrades silently. A scraper can return 0 results for weeks before anyone notices.

**Fix:** Add a `/api/health` endpoint that returns:
```json
{
  "scrapers": [
    { "id": "landflip", "last_run": "2026-03-11", "last_result": 12, "consecutive_zeros": 0, "status": "ok" },
    { "id": "landwatch", "last_run": "2026-03-09", "last_result": 0, "consecutive_zeros": 3, "status": "degraded" }
  ]
}
```
Add a "Scraper Health" panel to the map UI (collapsed by default, opens from TopBar).

#### 3.5 Schema migrations are manual (`db:push` only, no migration history)
`drizzle-kit push` is fine for dev but in production it diffs and applies changes without a migration history. If something goes wrong, there's no rollback.

**Fix:** Switch to `drizzle-kit generate` + `drizzle-kit migrate`. Store migration files in `drizzle/` (already configured in `drizzle.config.ts`). CI runs `drizzle-kit migrate` on deploy, not `db:push`.

---

## Part 4 — Recommended Action Plan

### Phase 1 — Foundation (do first, unlocks everything else)
**Priority: unblocks AI agent work**

| # | Task | Repo | Effort |
|---|------|------|--------|
| P1.1 | Extract `Database` class from `land_scout_browser.py` → use `get_adapter()` only | researcher | Small |
| P1.2 | Extract scoring logic → `scraper/scorer.py` with unit tests | researcher | Medium |
| P1.3 | Extract runner orchestration → `scraper/runner.py` | researcher | Medium |
| P1.4 | Add `data/last_run.json` structured output + `--json` CLI flag | researcher | Small |
| P1.5 | Add `vitest` + 10 baseline tests for `listing-helpers.ts` and API routes | app | Small |
| P1.6 | Add `.github/workflows/ci.yml` for both repos | both | Small |
| P1.7 | Clean up root of `land-researcher` (move legacy scripts) | researcher | Small |
| P1.8 | Fix `drizzle.config.ts` to error on missing `DATABASE_URL` | app | Tiny |

### Phase 2 — Robustness
**Priority: make it reliable without human babysitting**

| # | Task | Repo | Effort |
|---|------|------|--------|
| P2.1 | Persist circuit breaker state in `scraper_runs` table | researcher | Small |
| P2.2 | Wire notifier as post-run hook → Telegram on score ≥ 85 | researcher | Small |
| P2.3 | Add React `ErrorBoundary` around map + sidebar | app | Small |
| P2.4 | Add `/api/health` endpoint + scraper health UI panel | app | Medium |
| P2.5 | Add HMAC auth to `/api/scrape` endpoint | app | Small |
| P2.6 | Fix `noHoa` filter — add `asc(price)` ordering (currently no secondary sort) | app | Tiny |
| P2.7 | Add `NEXT_PUBLIC_AUTH_ENABLED` feature flag | app | Small |

### Phase 3 — Automation
**Priority: zero human input for scraping + deployments**

| # | Task | Repo | Effort |
|---|------|------|--------|
| P3.1 | `Dockerfile` for scraper + GitHub Actions cron trigger | researcher | Medium |
| P3.2 | Vercel deploy action on push to `main` | app | Small |
| P3.3 | Postgres-backed job queue for on-demand scrape triggers | both | Medium |
| P3.4 | Switch from `db:push` to `drizzle-kit migrate` in CI | app | Small |
| P3.5 | Wire `discovery/generate_scraper.py` → staging path → auto-test → promote | researcher | Large |

### Phase 4 — Polish
**Priority: better product**

| # | Task | Effort |
|---|------|--------|
| P4.1 | Map viewport-based listing loading (bbox query param) | Medium |
| P4.2 | Stadia Maps API key support in production | Tiny |
| P4.3 | Listing detail page at `/listing/[id]` | Medium |
| P4.4 | Async enrichment queue for spatial data | Large |
| P4.5 | Price history chart per listing | Medium |

---

## Part 5 — File Structure Target State

```
land-researcher/
  cli.py                        ← entrypoint (was: land_scout_browser.py, 2400 lines)
  config.py                     ← unchanged
  config.defaults.json          ← committed defaults (was: config.example.json)
  scraper/
    runner.py                   ← orchestration, retry, parallel (extracted)
    scorer.py                   ← score_listing() pure function (extracted)
    dedup.py                    ← dedup logic (extracted)
    enricher.py                 ← enrich_listing, spatial (extracted)
    notifier.py                 ← Telegram/email alerts (extracted)
  scrapers/
    base.py                     ← unchanged (good)
    registry.py                 ← unchanged (good)
    db_adapter.py               ← unchanged (good)
    db_neon_adapter.py          ← will absorb Database class from land_scout_browser.py
    national/                   ← unchanged
    states/                     ← unchanged
    staging/                    ← new: generated scrapers awaiting QA
  scripts/
    migrate_to_neon.py          ← unchanged
    setup.sh                    ← new: first-run setup
  tests/                        ← unchanged (117 tests)
  Dockerfile                    ← new
  .github/workflows/ci.yml      ← new

land-scout-app/
  app/
    api/
      listings/route.ts         ← add pagination
      health/route.ts           ← new: scraper health
      scrape/route.ts           ← add HMAC auth
    map/page.tsx                ← add ErrorBoundary
  lib/
    db/                         ← unchanged
    auth/                       ← unchanged
    types.ts                    ← unchanged
    listing-helpers.ts          ← unchanged
  tests/
    api/listings.test.ts        ← new
    lib/listing-helpers.test.ts ← new
  .github/workflows/
    ci.yml                      ← new
    deploy.yml                  ← new
  vercel.json                   ← new
  docker-compose.yml            ← unchanged
```

---

## Quick Wins You Can Do Right Now

These are all < 30 min and have immediate payoff:

1. **`data/last_run.json`** — write structured run output, enables health checks without parsing logs
2. **`vitest` baseline tests** — 10 tests in `listing-helpers.test.ts`, instant confidence on future changes
3. **`NEXT_PUBLIC_AUTH_ENABLED=false`** — hide broken auth UI until Neon Auth is configured
4. **`/api/health` endpoint** — expose scraper health, read from `scraper_runs` table
5. **`drizzle.config.ts` DATABASE_URL guard** — throw on missing, remove placeholder

---

*This audit was written by sofi after reading both repos end-to-end on 2026-03-11.*
*Next: implement Phase 1 in priority order. Each item is scoped for a single AI agent session.*
