# Specification

## Summary
**Goal:** Build "Scrambly," a Sonic-franchise-themed super app for ages 10–18 featuring a curated local search engine, two playable browser games, a moderated social community, parental controls with usage timer, age verification on every login, an always-visible SOS emergency button, and an ad blocker toggle — all styled with Sonic's iconic color palette.

**Planned changes:**
- **Sonic-themed UI:** Apply cobalt blue (#006DB7), golden yellow (#F5C800), white, and red accents with bold rounded typography, ring and speed-line decorative motifs across all pages (Home/Search, Games, Community, Settings, Parental Controls)
- **Search (Home):** Prominent search bar querying a bundled local Sonic franchise knowledge base (characters, games, lore, media); results show thumbnail, title, and short description; works fully offline
- **Games library:** Games page listing available games with preview thumbnails; includes a fully playable Block Blast-style tile puzzle game and a Sonic-inspired endless runner game, both offline-capable with score tracking
- **Community/Social:** User registration with age declaration; age-matched user connections; community feed for short posts; admin moderation panel that issues warnings — after 3 warnings the account is locked and the user is prompted to create a new account
- **Age verification:** On every login, user must declare their age (10–18 allowed); users outside this range see an access-denied screen; age stored in session for social age-matching
- **Parental controls:** PIN-protected parent dashboard to set a daily usage time limit (minutes); child is shown a friendly lockout screen when time expires; users aged 10–12 automatically enter "kid mode" hiding adult community features; dashboard shows today's session time
- **SOS emergency button:** Always-visible red SOS button in the app footer/nav; tap triggers a confirmation prompt then opens `tel:911`
- **Ad blocker toggle:** Settings page includes an Ad Blocker toggle (ON by default) with a visible "Ads Blocked" badge; preference persists across sessions; no ad slots shown in app content when enabled
- **Backend:** Single Motoko actor handling user accounts, age verification, community posts, warnings/locks, and parental control settings

**User-visible outcome:** Users aged 10–18 can log in to Scrambly, search Sonic franchise content offline, play two Sonic-themed browser games, connect and post in a moderated community matched by age, manage parental time limits via a PIN-protected dashboard, and always access an emergency call button — all within a cohesive Sonic-branded interface.
