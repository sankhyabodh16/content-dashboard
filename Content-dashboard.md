# 100 OPS Content Base — Project Reference

## What This Is

Content intelligence dashboard for an AI automation agency. Vite + React 18 + TypeScript + Tailwind CSS + Supabase.

## Tech Stack

- Vite + React 18 (TypeScript)
- Tailwind CSS v3
- React Router v6
- Lucide React (icons)
- Zustand (state)
- Supabase (`@supabase/supabase-js`)
- Google Fonts: Exo 2, IBM Plex Sans, JetBrains Mono
- No component libraries (no shadcn, no MUI)

## Supabase

```
VITE_SUPABASE_URL=https://tazcymlyfaylrbyfpqai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhemN5bWx5ZmF5bHJieWZwcWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjA0NjAsImV4cCI6MjA4OTU5NjQ2MH0.57fckVnRVI1XVJUTB6nq-ID2pty86cozpW26BhEkb28
```

Falls back to empty state (no mock data) if credentials are missing.

## Database Tables (5)

### feed_items (PRIMARY KEY: `platform_id` TEXT — NOT a UUID)
platform_id, platform, author, handle, title, body, post_url, likes, comments_count, shares_count, views_count, image_urls TEXT[], video_urls TEXT[], thumbnail_url, subreddit, creator_id (FK→creators), is_hidden, is_bookmarked, tags TEXT[], relevance (0-100), scraped_at, created_at

### creators
id (UUID PK), name, handle, platform, profile_url, avatar_color, followers, posts_scraped, last_scraped, created_at, updated_at
Note: `metrics` is a client-side field only (`Creator.metrics?: Record<string, string>`) — not a Supabase column. Platform-specific display metrics (connections, subscribers, following, members) are stored separately or populated by the scraper.

### trending_topics
id (UUID PK), category, topic, platform, feed_item_id (FK→feed_items.platform_id), created_at

### ideation_items
id (UUID PK), topic, outline, source_item_ids TEXT[] (references platform_id), status ('idea'|'writing'|'drafted'|'published'), platform, created_at, updated_at

### content_drafts
id (UUID PK), ideation_item_id (FK→ideation_items), platform, content, status ('draft'|'reviewed'|'published'), created_at, updated_at

## Key Data Rules

- `feed_items` PK is `platform_id` (TEXT), not UUID. All queries use `.eq('platform_id', ...)`.
- `ideation_items.source_item_ids` is TEXT[] matching `platform_id` values.
- "Clear Feed" = `is_hidden = true`, never delete rows.
- `is_bookmarked = true` means "in the List".
- All mutations are optimistic — update Zustand first, sync to Supabase in background, revert on error.

## Design Tokens

### Fonts
- `font-display`: Exo 2 — headings, titles, metrics
- `font-body`: IBM Plex Sans — paragraphs, UI text (default)
- `font-mono`: JetBrains Mono — badges, stats, timestamps, section headers

### Colors
- Brand red: `#E83232` (used sparingly — active nav, primary buttons, bookmarks)
- Surfaces: page `#0D0D0D`, base `#04040A`, card `#141414`, secondary `#1C1C1C`, input `#242424`
- Border: `#2E2E2E`
- Text: primary `#EDEDED`, accent `#A6A6A6`, muted `#999999`, subtle `#666666`
- Status: positive `#00E69D`, warning `#FFB224`, destructive `#FF3B7A`
- Platforms: youtube `#FF0000`, reddit `#FF4500`, instagram `#E1306C`, linkedin `#0A66C2`, twitter `#CCCCCC`

No white backgrounds. No Tailwind default colors. No Inter/Roboto/system fonts.

## Routes

| Route | Page | Status |
|-------|------|--------|
| `/` | Feed | ✅ Complete |
| `/creators` | Creator List (platform-grouped) | ✅ Complete |
| `/list` | List (bookmarked items) | ✅ Complete |
| `/archive` | Archive (hidden items) | ✅ Complete |
| `/ideation` | Ideation | ✅ Complete |
| `/content-studio` | Content Studio | 🔶 UI complete, no AI wired |
| `/brand-voice` | Brand Voice | ⬜ Placeholder |
| `/saved-drafts` | Saved Drafts | ⬜ Placeholder |
| `/analytics` | Performance | ⬜ Placeholder |

## File Structure

```
src/
├── lib/supabase.ts          # Supabase client + isSupabaseConfigured
├── lib/api.ts               # All Supabase query functions
├── lib/tokens.ts            # Design tokens
├── lib/utils.ts             # timeAgo(), formatDate()
├── data/mockData.ts         # Empty — no mock data (real Supabase only)
├── store/useStore.ts        # Zustand (syncs with Supabase)
├── types/index.ts           # FeedItem, Creator, TrendingTopic, IdeationItem, ContentDraft
└── components/
    ├── layout/              # Sidebar, MainLayout
    ├── feed/                # FeedPage, FeedCard, PlatformFilter, TrendingSidebar
    ├── creators/            # CreatorListPage, CreatorDetailModal, AddCreatorModal
    ├── list/                # ListPage
    ├── archive/             # ArchivePage
    ├── ideation/            # IdeationPage, IdeationCard
    ├── content-studio/      # ContentStudioPage
    ├── placeholders/        # ComingSoonPage
    └── ui/                  # PlatformBadge, EmptyState, ErrorBoundary
```