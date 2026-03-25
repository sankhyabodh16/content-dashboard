# 100 OPS Command Center — Build Progress

Last updated: 2026-03-25

---

## Status Overview

| Phase | Status |
|-------|--------|
| Frontend UI | ✅ Complete |
| Supabase backend integration | ✅ Live (real data only) |
| LinkedIn scraping script | ✅ Complete |
| Reddit scraping script | ✅ Complete |
| YouTube scraping script | ✅ Complete |
| GitHub Actions cron deployment | 🔶 Workflows exist, cron not scheduled |
| Deploy to Vercel | ⬜ Not started |
| Content Studio AI (Claude API) | ⬜ Not started |
| Brand Voice | ⬜ Placeholder only |
| Saved Drafts | ⬜ Placeholder only |
| Performance Analytics | ⬜ Placeholder only |
O
---

## ✅ Completed

### Infrastructure
- [x] Vite + React 18 + TypeScript project scaffolded
- [x] Tailwind CSS v3 configured
- [x] React Router v6 with all routes wired
- [x] Google Fonts loaded (Exo 2, IBM Plex Sans, JetBrains Mono)
- [x] Zustand store — async actions, optimistic updates, Supabase sync
- [x] Design token system (`src/lib/tokens.ts`) — single source of truth for colors, fonts, radii
- [x] TypeScript types (`src/types/index.ts`) — `FeedItem`, `Creator`, `TrendingTopic`, `IdeationItem`, `ContentDraft`
- [x] Error Boundary wrapping the full app
- [x] Custom scrollbar styling
- [x] `src/vite-env.d.ts` — Vite env type reference

### Supabase Integration
- [x] `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [x] `src/lib/supabase.ts` — client init + `isSupabaseConfigured` flag
- [x] `src/lib/api.ts` — `fetchFeedItems`, `fetchBookmarks`, `fetchArchived`, `toggleBookmark`, `hidePost`, `restorePost`, `fetchCreators`, `addCreator`, `fetchTrending`, `fetchIdeationItems`, `saveDraft`, `fetchDrafts`
- [x] `initialize()` async action in store — fetches all 4 datasets in parallel on app mount
- [x] **Mock data removed** — app runs on real Supabase data only; falls back to empty arrays (not dummy data) if credentials are missing
- [x] All mutations async with optimistic update + silent revert on Supabase error
- [x] `isLoading` state wired to `FeedCardSkeleton` in FeedPage
- [x] `MainLayout.tsx` calls `initialize()` on mount (runs once, cached in store)
- [x] 5 tables in Supabase: `creators`, `feed_items`, `trending_topics`, `ideation_items`, `content_drafts`
- [x] RLS policies — anon read-all; anon write on `feed_items`, `creators`, `ideation_items`, `content_drafts`

### Scraping
- [x] **LinkedIn scraping script** (`scraping scripts/linkedin_scraping.js`) — replaced n8n workflow
  - Fetches LinkedIn creators from Supabase
  - Calls Apify (actor `Wpp1BZ6yGWjySadk3`) for posts per creator
  - Filters out activity/reshare posts
  - Downloads images (image posts + document carousel cover pages) and videos from LinkedIn CDN
  - Re-uploads to Supabase Storage `post-media` bucket with `x-upsert: true`
  - Upserts posts to `feed_items` with permanent Supabase Storage URLs
- [x] **Supabase Storage** — `post-media` public bucket created
- [x] `n8n workspaces/` renamed to `scraping scripts/`
- [x] **Reddit scraping script** (`scraping scripts/reddit_scraping.js`)
  - Fetches Reddit creators (subreddits) from Supabase
  - Calls Apify (actor `TwqHBuZZPHJxiQrTU`) for hot posts per subreddit (daily, 20 posts)
  - Extracts images from media_assets → preview images → i.redd.it URL fallback chain
  - Extracts videos from `media.reddit_video.fallback_url`
  - Uploads images and videos to Supabase Storage `post-media/reddit/<id>/` with `x-upsert: true`
  - Upserts posts to `feed_items` with `title`, `body`, `subreddit`, and Supabase Storage URLs
  - Updates creator `last_scraped` and `posts_scraped` count after each subreddit
- [x] **YouTube scraping script** (`scraping scripts/youtube_scraping.js`)
  - Fetches YouTube creators from Supabase
  - Normalizes channel URL (strips trailing slash, /videos, /shorts, etc.)
  - Calls Apify channel actor (`REpzi5gxGt0DREvoi`) for last 3 videos per channel
  - Skips videos over 40 minutes
  - Downloads thumbnails and uploads to Supabase Storage `post-media/youtube/<id>/thumbnail.jpg`
  - Calls Apify transcript actor (`1s7eXiaukVuOr4Ueg`) per video — saves full transcript to `feed_items.transcript`
  - Upserts posts to `feed_items` with `title`, `thumbnail_url`, `transcript`, `likes`, `views_count`, `comments_count`
  - Updates creator `followers` (subscriber count), `last_scraped`, and `posts_scraped`
- [ ] GitHub Actions cron workflow (every 6h, free tier)

### Hosting plan
- React app → **Vercel** (free, auto-deploy on push)
- Scraping cron → **GitHub Actions** (free, 2000 min/month)
- DB + Storage → **Supabase** free tier

### Schema (current — differs from original spec)
- `feed_items.platform_id` TEXT PRIMARY KEY (not UUID) — supports n8n upsert dedup
- `feed_items`: `likes`, `comments_count`, `shares_count`, `views_count` (not single `engagement`)
- `feed_items`: `image_urls TEXT[]`, `video_urls TEXT[]`, `thumbnail_url` (not `image_url`)
- `feed_items`: `post_url` for external link
- `ideation_items.source_item_ids TEXT[]` — references `platform_id` values
- `content_drafts` table — links to `ideation_items`, stores generated content

### Layout
- [x] Fixed left sidebar (240px) with logo, nav sections, user profile
- [x] Active nav state with red left-border accent
- [x] Sidebar nav order: Creator List → Feed → List → Archive (RESEARCH), Ideation → Content Studio → Brand Voice → Saved Drafts (AI CREATION)

### Feed Page (`/`)
- [x] Platform filter tabs (All, LinkedIn, Twitter/X, Reddit, YouTube, Instagram)
- [x] Feed cards with full design spec
- [x] Smooth expand/collapse on card body (max-height CSS transition)
- [x] **"Add to List" button** — right side of action row, red when active
- [x] Dismiss card (X) → sends to Archive (sets `is_hidden = true` in Supabase)
- [x] Clear Feed button with confirm state (listed items preserved)
- [x] **Trending sidebar** — Today / This Week tab toggle inside "What's Trending"
- [x] Feed centered at max-width 680px
- [x] Skeleton loading cards wired to `isLoading` state

### Archive Page (`/archive`)
- [x] List view — platform, title, author, time, restore button
- [x] Restore individual posts back to feed (sets `is_hidden = false` in Supabase)
- [x] Empty state when archive is empty

### Creator List Page (`/creators`)
- [x] Stats bar (total creators, posts scraped, platforms count)
- [x] **Platform-grouped layout** — each platform in its own section with gradient header
- [x] Per-platform metric columns:
  - LinkedIn: Connections + Followers
  - YouTube: Subscribers
  - Twitter/X: Followers
  - Instagram: Followers + Following
  - Reddit: Members
- [x] Dynamic grid columns (5-col when platform has 2 metrics, 4-col otherwise)
- [x] Platform-colored avatars, vibrant section headers with platform accent colors
- [x] Rows are clickable — opens Creator Detail modal
- [x] Empty state when no creators exist

### Creator Detail Modal
- [x] Platform-colored gradient header with avatar, name, handle, platform badge
- [x] Metric blocks (platform-specific) + Posts Scraped
- [x] Meta section: Last Scraped, Added (formatted date), Profile URL (link)
- [x] **Edit mode** — pencil icon in header, inline form for Name + Profile URL; handle re-derived from URL on save
- [x] **Remove** — two-click confirm (turns red, shows "Confirm?", auto-resets after 4s)
- [x] Scrape Now + View Profile buttons (UI only; Scrape Now needs n8n wiring)
- [x] Escape key closes (or cancels edit); backdrop click closes

### Add Creator Modal
- [x] 3 fields: Creator Name, Platform, URL — all required
- [x] Custom platform dropdown (no native `<select>`)
- [x] Handle auto-derived from URL for all platforms:
  - LinkedIn / Twitter / Instagram / YouTube: last path segment → `@handle`
  - Reddit: last path segment after `r/` → `r/SubredditName` (case preserved, no extra field)
- [x] Inline field-level validation with error messages
- [x] Escape key + backdrop click to close; auto-focuses name field on open

### List Page (`/list`)
- [x] Filtered feed view (only `is_bookmarked = true`, non-hidden items)
- [x] Content centered at 680px matching feed layout
- [x] Analyzed / Pending status badge
- [x] Empty state

### Ideation Page (`/ideation`)
- [x] 2-column card grid
- [x] Each card: topic title, expandable outline, platform badge, source item count
- [x] **"Write This →" button** — sets `activeIdeation` in store and navigates to Content Studio
- [x] Empty state

### Content Studio Page (`/content-studio`)
- [x] Two-column layout: left panel (inputs + preview) / right panel (generated output)
- [x] Topic input, Outline textarea, Platform + Brand Voice custom dropdowns
- [x] Generate button with validation (mock 1.2s delay — AI not yet wired)
- [x] **Ideation banner** — pre-fills inputs when opened from Ideation page, dismissible
- [x] Preview: LinkedIn and X/Twitter mockups
- [x] Save Draft + Re Generate buttons (`saveDraft` wired to Supabase `content_drafts`)

### Placeholder Pages
- [x] Brand Voice, Saved Drafts, Performance — each with correct title, subtitle, coming soon empty state

### UI Components
- [x] `PlatformBadge` — all 5 platforms, sm/md sizes
- [x] `EmptyState` — icon, title, subtitle, optional action button
- [x] `FeedCardSkeleton` — animated pulsing skeleton
- [x] `ErrorBoundary` — catches runtime errors, shows reload card

---

## ⬜ Not Started

### Content Studio — AI wiring
- [ ] Wire Claude API for real content generation (currently mock placeholder)
- [ ] Re Generate button — re-calls API with same inputs
- [ ] Ideation item status update (`idea` → `writing` → `drafted`) on Save Draft

### Creator mutations — backend
- [ ] **Scrape Now** — trigger GitHub Actions `workflow_dispatch` for the creator's platform, passing `creator_id` as input; scraping script filters to that one creator; requires `VITE_GITHUB_TOKEN` + `VITE_GITHUB_REPO` env vars
- [ ] `updateCreator` — persist name/URL edits to Supabase (`useStore` updates local state only today)

### UX gaps
- [x] **Clear Archive button** — two-click confirm (turns red → "Confirm delete?"), permanently deletes all archived posts from Supabase + clears local state; hidden when archive is empty
- [ ] Error toast on Supabase mutation failure (currently silent revert only)
- [x] **"Open original"** — open `post_url` in new tab from feed card (2026-03-25)

### Scraping fixes (2026-03-22)
- [x] `posts_scraped` now uses real DB count (idempotent — re-runs don't inflate)
- [x] LinkedIn `connection_count` column now read directly in UI (separate from `followers`)
- [x] Reddit `subreddit_subscribers` → `creators.followers` on each scrape run
- [x] YouTube subscriber count fixed — reads from `aboutChannelInfo.numberOfSubscribers`
- [x] Creator page `getMetric` — shows `—` for zero/missing values instead of `0`
- [x] **GitHub Actions workflows** — 5 workflow files (`scrape-reddit`, `scrape-linkedin`, `scrape-youtube`, `extract-trending`, `extract-ideation`), all `workflow_dispatch` triggered
- [x] **`trending_extraction.js`** — Claude Haiku reads last 24h feed items, extracts 8-12 trending topics (1-2 words), replaces `trending_topics` table each run
- [x] **`ideation_extraction.js`** — Claude Sonnet reads bookmarked items, groups by theme, generates topic + outline per cluster, skips already-used source IDs, saves to `ideation_items`
- [x] `@anthropic-ai/sdk` added as dependency

### FeedCard improvements (2026-03-22)
- [x] `ImageCarousel` — left/right nav + dot indicators for multi-image posts
- [x] Video renders inline via `<video>` element (Supabase Storage URLs, no CORS)
- [x] Body text truncated to 2 lines (`-webkit-line-clamp: 2`) with expand/collapse
- [x] `PostBody` component renders paragraphs preserving newlines from LinkedIn posts

### Bug fixes (2026-03-25)
- [x] `removeCreator` — now calls `deleteCreator` in Supabase (was local state only); added DELETE RLS policy on `creators` table
- [x] **"Open original"** — `post_url` opens in new tab from feed card action row

### Production deployment (planned 2026-03-25)
- [ ] **Step 1** — `git init`, `.gitignore`, create private GitHub repo, push to `main`
- [ ] **Step 2** — Add GitHub Actions secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `APIFY_TOKEN`, `ANTHROPIC_API_KEY`
- [ ] **Step 3** — Add cron schedules to workflows: scraping every 6h; trending + ideation daily
- [ ] **Step 4** — Deploy to Vercel: connect GitHub repo, set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] **Step 5** — Wire Scrape Now: `creator_id` workflow input + GitHub dispatch API from frontend + `VITE_GITHUB_TOKEN` / `VITE_GITHUB_REPO` env vars
- [ ] **Step 6** — `updateCreator` persists to Supabase

### Future Features
- [ ] Brand Voice configuration page
- [ ] Saved Drafts page (reads from `content_drafts`)
- [ ] Performance Analytics
- [ ] Trending topics clickable (filter feed by topic)
- [ ] Real-time Supabase subscription for new scraped posts
- [ ] Settings page

---

## File Structure (current)

```
src/
├── main.tsx                        ✅ With ErrorBoundary
├── App.tsx                         ✅ All routes: /, /creators, /list, /archive, /ideation, /content-studio, /brand-voice, /saved-drafts, /analytics
├── index.css                       ✅ Scrollbar, skeleton animation
├── vite-env.d.ts                   ✅ Vite env types
├── lib/
│   ├── supabase.ts                 ✅ Client + isSupabaseConfigured
│   ├── api.ts                      ✅ All Supabase query functions
│   ├── tokens.ts                   ✅ Design tokens (colors, fonts, radii)
│   └── utils.ts                    ✅ timeAgo(), formatDate()
├── data/
│   └── mockData.ts                 ✅ Empty arrays only (mock data removed)
├── store/
│   └── useStore.ts                 ✅ initialize(), async mutations, isLoading, updateCreator
├── types/
│   └── index.ts                    ✅ FeedItem, Creator (+ metrics?), TrendingTopic, IdeationItem, ContentDraft
└── components/
    ├── layout/
    │   ├── Sidebar.tsx             ✅
    │   └── MainLayout.tsx          ✅ Calls initialize() on mount
    ├── feed/
    │   ├── FeedPage.tsx            ✅
    │   ├── FeedCard.tsx            ✅
    │   ├── FeedCardSkeleton.tsx    ✅
    │   ├── PlatformFilter.tsx      ✅
    │   └── TrendingSidebar.tsx     ✅ Today / This Week tabs
    ├── archive/
    │   └── ArchivePage.tsx         ✅
    ├── list/
    │   └── ListPage.tsx            ✅
    ├── ideation/
    │   ├── IdeationPage.tsx        ✅
    │   └── IdeationCard.tsx        ✅
    ├── creators/
    │   ├── CreatorListPage.tsx     ✅ Platform-grouped, metric columns, clickable rows
    │   ├── CreatorDetailModal.tsx  ✅ Metrics, edit, remove confirm
    │   └── AddCreatorModal.tsx     ✅ 3 fields, URL-derived handle for all platforms
    ├── content-studio/
    │   └── ContentStudioPage.tsx   ✅ saveDraft → Supabase
    ├── placeholders/
    │   └── ComingSoonPage.tsx      ✅
    └── ui/
        ├── PlatformBadge.tsx       ✅
        ├── EmptyState.tsx          ✅
        └── ErrorBoundary.tsx       ✅
```
