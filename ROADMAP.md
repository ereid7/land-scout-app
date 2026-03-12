# Land Scout — Product Roadmap
> Last updated: 2026-03-11 | Vision: the go-to platform for rural land buyers

---

## The Thesis

The next decade belongs to rural land. Remote work decoupled income from geography permanently.
Dollar devaluation instinct is spreading mainstream. People want land to grow things, store things,
build something real. Zillow doesn't serve this market. Land listing sites have terrible UX.
Land Scout is the product that should exist.

**Target users:** Families, homesteaders, remote workers, preppers, investors
**Price range:** $2K–$50K | **Sweet spot:** $5K–$20K for 5–20 acres
**Geographic focus:** Midwest + Appalachia + South (19 states, expanding)

---

## Phase 1 — Personal Tool ✅ DONE

- [x] 90+ scraper sources across 19 states
- [x] Scoring system (price/acre, water, trees, HOA, freshness)
- [x] SQLite → Neon Postgres migration
- [x] Next.js map UI with filters
- [x] 148 Python tests + 16 JS tests
- [x] CI/CD (GitHub Actions)
- [x] Structured run output (last_run.json)
- [x] Circuit breaker (DB-backed)
- [x] Notification pipeline (Telegram)
- [x] Dockerfile + scraper cron
- [x] Scraper staging pipeline (auto-discovery)

---

## Phase 2 — Product Foundation (in progress)

### UX
- [x] Listing detail page `/listing/[id]`
- [x] Health panel overlay
- [x] Bbox viewport loading
- [ ] **Landing page + waitlist** ← agent running now
- [ ] **Drive-time radius filter** ("within 2h of Minneapolis") ← agent running
- [ ] **Property brief** (auto due diligence summary) ← agent running
- [ ] User onboarding flow ("what are you looking for?")
- [ ] Mobile-responsive layout

### Data enrichment
- [ ] **Drive time to nearest major city** ← agent running (Python side)
- [ ] FEMA flood zone API (auto-populate flood_zone column)
- [ ] USDA soil type via Web Soil Survey API
- [ ] Zoning classification (county parcel data)
- [ ] Cell coverage indicator (T-Mobile coverage tile API)

### Alerts
- [ ] Email alerts for saved searches (SendGrid/Resend)
- [ ] Price drop alerts (listings.price_reduced = true → notify watchers)
- [ ] Auction date alerts (county tax sales with known dates)

---

## Phase 3 — Multi-User Platform (Q2 2026)

### Accounts
- [ ] Full Neon Auth setup (email OTP + Google)
- [ ] User profiles (target location, budget, criteria)
- [ ] Unlimited saved searches (Pro)
- [ ] Watchlist (track specific listings, get alerts on changes)
- [ ] Notes per listing (store in DB, per-user)

### Pricing
- Free tier: map access, 3 saved searches, no alerts
- **Pro ($9/mo):** unlimited searches, email alerts, drive-time filter, property brief PDF
- **Land Pro ($29/mo):** full comps, tax history, off-market access, API access

### Distribution
- [ ] SEO landing pages per state ("cheap land in Kentucky under $15K")
- [ ] SEO landing pages per use case ("homestead land for sale", "wooded land with water")
- [ ] Content: "How to buy rural land" guide series
- [ ] Affiliate: link to title insurance, survey companies
- [ ] Newsletter: weekly "Top 10 deals this week" digest

---

## Phase 4 — Platform & Moat (Q3-Q4 2026)

### Data moat
- [ ] Proprietary sale outcomes dataset (did the listing sell? at what price?)
- [ ] Price trend analytics per county (appreciation/depreciation over time)
- [ ] Comparable sales ("comps") for any listing
- [ ] Buildability score (zoning + utilities + topography composite)

### Supply side
- [ ] FSBO listing submission (owners list directly, we score and distribute)
- [ ] Agent/broker accounts (bring their inventory)
- [ ] County tax deed auction calendar (consolidated national view)
- [ ] Off-market pipeline (heirs properties, estate sales, distressed owners)

### Community
- [ ] User-submitted deals (crowdsourced listings)
- [ ] County guides (crowdsourced intel: buyer-friendly counties, gotchas)
- [ ] Deal reviews (bought this? share your experience)
- [ ] Forum/Discord for rural land buyers

### Enterprise
- [ ] API access (hedge funds, REITs, county assessors)
- [ ] White-label for regional brokers
- [ ] Data licensing (sale outcomes, price trends)

---

## Technical Roadmap

### Needs Evan (credentials)
- [ ] Neon production project + DATABASE_URL
- [ ] Vercel deployment (connect GitHub → auto-deploy)
- [ ] GitHub Secrets (DATABASE_URL, TELEGRAM_BOT_TOKEN, VERCEL_TOKEN)
- [ ] Telegram bot token for notifications

### Agent can do autonomously
- [ ] Add new scrapers (discover → stage → test → promote)
- [ ] Fix broken scrapers (circuit breaker alert → agent diagnoses → fixes → pushes)
- [ ] Tune scoring weights based on feedback
- [ ] Add new states
- [ ] Write SEO content pages
- [ ] A/B test filter UI changes
- [ ] Monitor health + alert on issues

---

## Metrics to Track (once live)

- Weekly active users
- Saved searches created
- Listing detail page views (intent signal)
- Email waitlist signups
- Pro conversions
- New listings found per week
- Scraper health (zero-yield rate)

---

## The Big Picture

Year 1 goal: 1,000 active users, 50 Pro subscribers = $5,400 MRR
Year 2 goal: 10,000 users, 500 Pro + 50 Land Pro = $49,500 MRR
Year 3: Platform flywheel (user submissions + comps + community) → defensible moat

The land market is massive and the tooling is terrible. We're building the product
that serious rural land buyers have been waiting for.
