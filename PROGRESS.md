# 100 OPS Content Base — Build Progress

Last updated: 2026-04-18 (AI Creative Studio — Content Ideas)

---

## Status Overview

| Phase | Status |
|-------|--------|
| Frontend UI (post-revamp surface) | ✅ Complete |
| Supabase backend integration | ✅ Live (real data only) |
| LinkedIn scraping script | ✅ Complete |
| Reddit scraping script | ✅ Complete |
| YouTube scraping script | ✅ Complete |
| GitHub Actions deployment | ✅ `workflow_dispatch` only (cron removed, n8n handles scheduling) |
| Trending extraction (Claude Haiku) | ✅ Live |
| Deployed to Vercel | ✅ Live |
| AI Creative Studio — Content Ideas | ✅ Live (`/ideas`, `/ideas/:id`) |
| Library → Ideation skill (manual) | ✅ Working — AI analyzes post text + images, inserts ideas via Supabase |
| Library → Ideation skill (automated) | ⬜ Not started — Claude Code skill, auto-tags `ideation-complete` |

---

## Current App Surface (post-revamp)

Active sidebar sections:

- **RESEARCH**
  - Creator List (`/creators`)
  - Feed (`/`)
  - Library (`/library`)

Archive (`/archive`) still exists as a route but is accessed via a button on the Feed top bar — not a sidebar entry.

**Removed entirely** in the 2026-04-16 revamp:
- AI CREATION sidebar section (Ideation, Content Studio, Brand Voice, Saved Drafts)
- ANALYTICS sidebar section (Performance)
- `ideation_items` / `content_drafts` store state and API functions
- `IdeationItem` and `ContentDraft` types
- `scraping scripts/ideation_extraction.js` + `.github/workflows/extract-ideation.yml`
- `.claude/skills/content-repurpose/`
- `src/data/mockData.ts`, `src/components/bookmarks/`, `src/components/ideation/`, `src/components/content-studio/`, `src/components/placeholders/`

DB tables `ideation_items` and `content_drafts` still exist in Supabase but have no reader. They'll be repurposed or dropped when AI Creative Studio is designed.

---

## ✅ Completed

### Infrastructure
- [x] Vite + React 18 + TypeScript project scaffolded
- [x] Tailwind CSS v3 configured
- [x] React Router v6 with nested routes under MainLayout
- [x] Google Fonts loaded (Exo 2, IBM Plex Sans, JetBrains Mono)
- [x] Zustand store — async actions, optimistic updates, Supabase sync
- [x] Design token system (`src/lib/tokens.ts`) — C (colors), F (fonts), R (radii), PLATFORM_COLORS
- [x] TypeScript types (`src/types/index.ts`) — `FeedItem`, `Creator`, `TrendingTopic`
- [x] Error Boundary wrapping the full app
- [x] Custom scrollbar styling
- [x] `src/vite-env.d.ts` — Vite env type reference

### Supabase Integration
- [x] `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [x] `src/lib/supabase.ts` — client init + `isSupabaseConfigured` flag
- [x] `src/lib/api.ts` — `fetchFeedItems`, `fetchBookmarks`, `fetchArchived`, `toggleBookmark` (now writes `tags` alongside `is_bookmarked`), `hidePost`, `restorePost`, `deletePost`, `deleteAllArchived`, `fetchCreators`, `addCreator`, `deleteCreator`, `updateCreator`, `fetchTrending`, `fetchContentIdeas`, `createContentIdea`, `updateContentIdea`, `deleteContentIdea`
- [x] `initialize()` async action in store — fetches feed items, creators, trending, content ideas in parallel on app mount
- [x] All mutations async with optimistic update + silent revert on Supabase error
- [x] `isLoading` state wired to `FeedCardSkeleton` in FeedPage
- [x] `MainLayout.tsx` calls `initialize()` on mount (runs once, cached in store)
- [x] 6 tables in Supabase: `creators`, `feed_items`, `trending_topics`, `content_ideas`, `ideation_items` (orphaned), `content_drafts` (orphaned)
- [x] RLS policies — anon read/write on `feed_items`, `creators`; DELETE policies on both

### Scraping
- [x] **LinkedIn scraping script** (`scraping scripts/linkedin_scraping.js`)
  - Fetches LinkedIn creators from Supabase
  - Calls Apify (actor `Wpp1BZ6yGWjySadk3`) for posts per creator
  - Filters out activity/reshare posts
  - Downloads images (image posts + document carousel cover pages) and videos from LinkedIn CDN
  - Re-uploads to Supabase Storage `post-media` bucket
  - Upserts posts to `feed_items` with permanent Supabase Storage URLs
- [x] **Reddit scraping script** (`scraping scripts/reddit_scraping.js`)
  - Fetches Reddit creators (subreddits) from Supabase
  - Calls Apify (actor `TwqHBuZZPHJxiQrTU`) — 10 posts per subreddit, sort `top` (daily)
  - Extracts images from media_assets → preview images → i.redd.it URL fallback chain
  - Extracts videos from `media.reddit_video.fallback_url`
  - Uploads images and videos to Supabase Storage `post-media/reddit/<id>/`
  - Upserts posts with `title`, `body`, `subreddit`, Supabase Storage URLs
  - Updates creator `followers` from `subreddit_subscribers` + `last_scraped`
- [x] **YouTube scraping script** (`scraping scripts/youtube_scraping.js`)
  - Fetches YouTube creators from Supabase
  - Normalizes channel URL
  - Calls Apify channel actor (`REpzi5gxGt0DREvoi`) for last 3 videos per channel
  - Skips videos over 40 minutes
  - Downloads thumbnails to Supabase Storage
  - Calls Apify transcript actor (`1s7eXiaukVuOr4Ueg`) — saves full transcript to `feed_items.transcript`
  - Upserts posts with `title`, `thumbnail_url`, `transcript`, `likes`, `views_count`, `comments_count`
  - Updates creator `followers` (subscriber count), `last_scraped`
- [x] **Trending extraction** (`trending_extraction.js`) — Claude Haiku reads last 24h feed items, extracts 8–12 trending topics, replaces `trending_topics` table each run

### Hosting / Deployment
- React app → **Vercel** (free, auto-deploy on push to `main`)
- Scraping / trending → **GitHub Actions** `workflow_dispatch` (n8n triggers via GitHub dispatch API)
- DB + Storage → **Supabase** free tier
- GitHub Actions secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `APIFY_TOKEN`, `ANTHROPIC_API_KEY`
- Scrape Now from frontend: `VITE_GITHUB_TOKEN` + `VITE_GITHUB_REPO` env vars; dispatch API + polling progress bar
- `vercel.json` catch-all rewrite → fixes SPA 404 on hard refresh

### Schema (current)
- `feed_items.platform_id` TEXT PRIMARY KEY (supports upsert dedup)
- `feed_items`: `likes`, `comments_count`, `shares_count`, `views_count` (per-metric, not single `engagement`)
- `feed_items`: `image_urls TEXT[]`, `video_urls TEXT[]`, `thumbnail_url`
- `feed_items`: `post_url`, `title`, `body`, `subreddit`, `transcript`
- `feed_items`: `is_hidden BOOL` (archive), `is_bookmarked BOOL` (library)
- `feed_items.tags TEXT[]` — **repurposed 2026-04-17** for Library state: `'yet-to-ideate'` / `'ideation-complete'`

### Sidebar / Layout
- [x] Fixed left sidebar (240px) — logo, single RESEARCH section, user profile footer
- [x] Active nav state with red left-border accent
- [x] Sidebar order (post-revamp): Creator List → Feed → Library

### Feed Page (`/`)
- [x] **3-column layout** — Platform sidebar (left, 240px) | Feed center (max-width 640px) | Trending sidebar (right, 276px)
- [x] **Platform filter** — left sidebar multiselect pills; unchecking all shows everything
- [x] **Trending sidebar** — static box
- [x] Feed cards with full design spec
- [x] `ImageCarousel` — left/right nav + dot indicators for multi-image posts
- [x] Inline `<video>` element for video posts (Supabase Storage URLs)
- [x] Body text clamped to 2 lines with smooth expand/collapse
- [x] `PostBody` preserves paragraph breaks
- [x] Platform-specific engagement row (LinkedIn: 👍💬🔁 · YouTube: 👁👍💬 · Reddit: ⬆💬)
- [x] **"Save to Library" button** — right side of action row, red when active, uses Bookmark icons (renamed from "Add to List" 2026-04-17)
- [x] Dismiss card (X) → archive (sets `is_hidden = true`)
- [x] **Archive button** — top-right next to Clear Feed, navigates to `/archive` (replaces old sidebar tab)
- [x] Clear Feed button with two-click confirm
- [x] Skeleton loading cards wired to `isLoading`

### Library Page (`/library`) — new 2026-04-17
- [x] Renamed from "List" — now called Library (sidebar label, page header, FeedCard button text)
- [x] **Kanban layout** — two columns side by side:
  - *Yet To Ideate* (orange accent, Clock icon)
  - *Ideation Complete* (green accent, CheckCircle2 icon)
- [x] **Grouping rule (tolerant):** items tagged `ideation-complete` → Complete column; everything else → Yet To Ideate. No DB backfill needed.
- [x] **Collapsible columns** — chevron in header shrinks a column to a 56px vertical rail (icon + count pill + rotated title); the open column grows to fill freed space
- [x] **Compact `LibraryCard`** — platform badge, author, time, 3-line snippet (title or body)
- [x] **`FeedItemModal`** — clicking a card opens the full `FeedCard` in a centered modal (Escape / backdrop click to close); preserves all media, body, actions
- [x] Header subtitle: `{total} saved · {pending} yet to ideate · {complete} complete`
- [x] Empty state for zero bookmarks

### AI Creative Studio — Content Ideas (`/ideas`, `/ideas/:id`) — new 2026-04-18

- [x] **Content Ideas list page** (`/ideas`) — sidebar nav entry under AI STUDIO, lists all ideas, New idea button, each row shows title (2-line wrap) + outline preview snippet + timestamp
- [x] **Content Idea detail page** (`/ideas/:id`) — full-page route (not a side panel), centered layout (max-width 860px), back-arrow nav
- [x] **Title field** — auto-sizing `<textarea>` (full wrap, no truncation), saves on blur
- [x] **Outline field** — plain auto-sizing `<textarea>`, saves on blur
- [x] **Source chip** — compact row: platform badge + author + post excerpt + external link to original post; linked via `source_platform_id → feed_items.platform_id`
- [x] **Enrich with Perplexity** button (UI wired, integration pending)
- [x] **Delete idea** — top bar button with confirm dialog, navigates back to list
- [x] **`content_ideas` Supabase table** — `id UUID PK`, `title TEXT`, `outline TEXT`, `source_platform_id TEXT FK→feed_items`, `created_at`, `updated_at`
- [x] **Store actions** — `contentIdeas[]`, `createIdea(source_platform_id)`, `updateIdea(id, patch)`, `deleteIdea(id)` — all optimistic with Supabase sync
- [x] **Manual AI ideation pipeline** — Claude analyzes bookmarked post text + carousel images, generates ideas mapped to `content-pillars.md` templates (Pillar 1–4), inserts directly to `content_ideas` via Supabase REST

#### Content Pillars document (`content-pillars.md`)
- [x] 4 pillars defined with title blueprints, 3–6 reusable templates each, quality checklists
  - Pillar 1: Tool Drops & Power Tips (FOMO / contrarian swap / news drop)
  - Pillar 2: Automation Systems Builds / Demos (envy + effort gap flex)
  - Pillar 3: AI Tool Reviews / Comparisons (earned verdict + finality)
  - Pillar 4: AI Business / Strategy (volume proof + directional call + time anchor)

### Archive Page (`/archive`)
- [x] List view — platform, title, author, time, restore button
- [x] Restore individual posts back to feed (`is_hidden = false`)
- [x] **Clear Archive** — two-click confirm, permanently deletes all archived rows (`deleteAllArchived`)
- [x] Empty state
- [x] Reached only via Feed top-bar button (no sidebar entry)

### Creator List Page (`/creators`)
- [x] **Post counts sourced from `feed_items` grouped by `creator_id`** (not stale `creator.posts_scraped` column) — updated 2026-04-16
- [x] Stats bar (total creators, total posts from feed_items, platforms count)
- [x] **Platform-grouped layout** — each platform in its own section with gradient header (`linear-gradient(135deg, ${color}18 0%, ${color}08 50%, transparent 100%)`)
- [x] Per-platform metric columns:
  - LinkedIn: Connections + Followers
  - YouTube: Subscribers
  - Twitter/X: Followers
  - Instagram: Followers + Following
  - Reddit: Members
- [x] Dynamic grid columns (5-col with 2 metrics, 4-col otherwise)
- [x] Platform-colored avatars + vibrant section headers
- [x] Rows clickable → Creator Detail modal
- [x] Empty state

### Creator Detail Modal
- [x] Platform-colored gradient header with avatar, name, handle, platform badge
- [x] Metric blocks (platform-specific) + Posts Scraped
- [x] Meta: Last Scraped, Added, Profile URL
- [x] **Edit mode** — pencil icon, inline form (Name + Profile URL); handle re-derived from URL
- [x] **Remove** — two-click confirm (persists to Supabase via `deleteCreator`)
- [x] **Scrape Now** — fires GitHub Actions `workflow_dispatch` for that platform; progress bar polls every 10s (Dispatching → Queued → Running → Done/Failed)
- [x] Escape key closes (or cancels edit); backdrop click closes

### Add Creator Modal
- [x] 3 fields: Creator Name, Platform, URL — all required
- [x] Custom platform dropdown (no native `<select>`)
- [x] Handle auto-derived from URL for all platforms (LinkedIn/Twitter/Instagram/YouTube → `@handle`; Reddit → `r/SubredditName`)
- [x] Inline field-level validation
- [x] Escape + backdrop click to close; auto-focuses name field

### UI Components
- [x] `PlatformBadge` — all 5 platforms, sm/md sizes
- [x] `EmptyState` — icon, title, subtitle, optional action button
- [x] `FeedCardSkeleton` — animated pulsing skeleton
- [x] `ErrorBoundary` — catches runtime errors, shows reload card

---

## 2026-04 Revamp Timeline

### 2026-04-16 — Strip AI surface
- Removed AI CREATION sidebar section and all ideation/content-studio components + routes
- Removed ANALYTICS / Performance section
- Removed `ideation_items` / `content_drafts` state, API, types
- Deleted `scraping scripts/ideation_extraction.js`, `.github/workflows/extract-ideation.yml`, `.claude/skills/content-repurpose/`, `src/data/mockData.ts`, `src/components/bookmarks/`
- Moved Archive from sidebar tab to a button on Feed top bar (route preserved)
- Creator List post counts re-sourced from `feed_items` aggregation

### 2026-04-18 — AI Creative Studio: Content Ideas + UI polish

- Added `content_ideas` Supabase table and full CRUD (store + API)
- Built `/ideas` list page and `/ideas/:id` full-page detail (replaced side panel approach)
- Added `content-pillars.md` — 4-pillar framework with title blueprints and quality checklists
- Manual AI ideation pipeline: fetch bookmarked posts → analyze text + images with Claude → generate pillar-mapped ideas → insert to `content_ideas` via Supabase REST
- First ideation run: Nick Saraev LinkedIn post (carousel, 3 images) → 5 ideas across Pillars 1, 2, 4
- UI readability pass across all pages:
  - ContentIdeasPage: title wraps to 2 lines, outline preview snippet per row
  - ContentIdeaPage: title uses auto-sizing textarea (no truncation), outline line-height/spacing improved
  - FeedCard: body text → primary color, action row divider visible, stats text larger/brighter
  - LibraryCard: snippet 13→14px, line-height bump
  - Sidebar: active nav item font-weight 400→500
  - Archive: title column primary color, row dividers visible

### 2026-04-17 — Library (formerly List)
- Renamed List → Library (path `/library`, `BookMarked` sidebar icon)
- FeedCard: `Save to Library` / `Remove from Library` with Bookmark icons
- Repurposed `feed_items.tags TEXT[]` with sentinel values `'yet-to-ideate'` / `'ideation-complete'`
- Store `toggleList` → `toggleLibrary`: appends `'yet-to-ideate'` on save; strips both state tags on remove
- `toggleBookmark` API signature now takes `(platformId, nextBookmarked, nextTags)`
- New `LibraryPage` — 2-column kanban, collapsible, with compact `LibraryCard` + `FeedItemModal`
- Folder `src/components/list/` deleted; replaced by `src/components/library/`

---

## ⬜ Not Started

### AI Creative Studio — next phases
- [ ] **Enrich with Perplexity** — wire Perplexity API to pull research into idea outline
- [ ] **Drafting flow** — expand idea into full platform draft (LinkedIn post, YouTube script, etc.) using Claude
- [ ] **`content_drafts` table** — store per-platform drafts linked to a content idea (table exists, currently orphaned)
- [ ] **Ideation-complete tagging** — when an idea is created from a Library item, flip that item's tag to `ideation-complete` automatically

### Library → Ideation skill (automated)
- [ ] Claude Code skill that fetches all items with `'yet-to-ideate'` tag
- [ ] Analyzes each post (text + images) against content pillars
- [ ] Creates `content_ideas` rows and flips tag to `'ideation-complete'`
- [ ] Triggered manually from Library page or on a schedule

### UX gaps
- [ ] Error toast on Supabase mutation failure (currently silent revert only)
- [ ] Pagination on `fetchFeedItems` (currently fetches all rows)
- [ ] Real-time Supabase subscription for new scraped posts

---

## 🐛 Known bugs still open

- [ ] YouTube `transcript` field — saved by scraper but missing from `FeedItem` type; data silently dropped in UI
- [ ] Reddit members metric — UI reads `metrics.members` but data lives in `followers` column → always shows `—`
- [ ] `followers` type mismatch — type says `string`, LinkedIn/Reddit scripts save a `number`
- [ ] Metric display breaks for "1.2M" format — `Number("1.2M")` returns `NaN`
- [ ] `clearFeed` previously had a race; currently uses `Promise.all` on hide calls — verify no silent failures at scale
- [ ] LinkedIn `handle` on feed items — saves post author's profile ID, not the creator's handle
- [ ] No pagination on `fetchFeedItems`

---

## File Structure (current)

```
src/
├── main.tsx                        ErrorBoundary wrapper
├── App.tsx                         Routes: /, /creators, /library, /archive, /ideas, /ideas/:id
├── index.css                       Scrollbar, skeleton animation
├── vite-env.d.ts
├── lib/
│   ├── supabase.ts                 Client + isSupabaseConfigured
│   ├── api.ts                      fetchFeedItems, toggleBookmark (with tags), hidePost, restorePost, deleteAllArchived, fetchCreators, addCreator, deleteCreator, updateCreator, fetchTrending
│   ├── tokens.ts                   C, F, R, PLATFORM_COLORS
│   └── utils.ts                    timeAgo(), formatDate()
├── store/
│   └── useStore.ts                 initialize(), toggleLibrary, hidePost, restorePost, clearFeed, clearArchive, addCreator, removeCreator, updateCreator, createIdea, updateIdea, deleteIdea
├── types/
│   └── index.ts                    FeedItem, Creator, TrendingTopic, ContentIdea, Platform
└── components/
    ├── layout/
    │   ├── Sidebar.tsx             RESEARCH section only
    │   └── MainLayout.tsx          Calls initialize() on mount
    ├── feed/
    │   ├── FeedPage.tsx            3-column layout, Archive button in top bar
    │   ├── FeedCard.tsx            Save to Library button
    │   ├── FeedCardSkeleton.tsx
    │   ├── PlatformSidebar.tsx
    │   └── TrendingSidebar.tsx
    ├── archive/
    │   └── ArchivePage.tsx         Reached via Feed top-bar button
    ├── library/
    │   ├── LibraryPage.tsx         2-column collapsible kanban
    │   ├── LibraryCard.tsx         Compact card (click → modal)
    │   └── FeedItemModal.tsx       Full FeedCard in overlay
    ├── creators/
    │   ├── CreatorListPage.tsx     Platform-grouped, post counts from feed_items
    │   ├── CreatorDetailModal.tsx  Scrape Now + progress, edit, remove
    │   └── AddCreatorModal.tsx
    ├── studio/
    │   ├── ContentIdeasPage.tsx    List view — title (2-line wrap) + outline preview + timestamp
    │   └── ContentIdeaPage.tsx     Full-page detail — auto-sizing title + plain textarea outline + source chip
    └── ui/
        ├── PlatformBadge.tsx
        ├── EmptyState.tsx
        └── ErrorBoundary.tsx
```

---

## Historical bug fixes (kept for reference)

### 2026-03-22 — Scraping fixes
- [x] `posts_scraped` uses real DB count (idempotent)
- [x] LinkedIn `connection_count` read directly (separate from `followers`)
- [x] Reddit `subreddit_subscribers` → `creators.followers`
- [x] Reddit config: 20 → 10 posts, sort `hot` → `top` (daily)
- [x] YouTube subscribers fixed (`aboutChannelInfo.numberOfSubscribers`)
- [x] Creator page `getMetric` shows `—` instead of `0`

### 2026-03-25 — Production deployment + fixes
- [x] git init, .gitignore, pushed to GitHub (`sankhyabodh16/content-dashboard`)
- [x] GitHub Actions secrets wired
- [x] Deployed to Vercel
- [x] `removeCreator` persists to Supabase (DELETE RLS policy added)
- [x] "Open original" opens `post_url` in new tab
- [x] Vercel SPA rewrite fixes 404 on hard refresh

### 2026-03-30 — Post-deploy polish
- [x] GitHub Actions cron removed — `workflow_dispatch` only; n8n handles scheduling
- [x] Scrape Now wired: GitHub dispatch API + polling progress bar
- [x] `updateCreator` persists with optimistic revert
- [x] Supabase 404s fixed (removed `.single()` from toggle/hide/restore)
- [x] Archive DELETE RLS added — Clear Archive truly deletes
- [x] Scrapers no longer overwrite `is_hidden` / `is_bookmarked` on re-scrape
- [x] Feed card engagement row platform-specific
