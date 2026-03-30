import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const APIFY_TOKEN = process.env.APIFY_TOKEN

const APIFY_CHANNEL_ACTOR = 'REpzi5gxGt0DREvoi'
const APIFY_TRANSCRIPT_ACTOR = '1s7eXiaukVuOr4Ueg'
const CREATOR_ID = process.env.CREATOR_ID || null

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${path} → ${res.status}: ${text}`)
  }
  return res.json().catch(() => null)
}

async function getYouTubeCreators() {
  return supabaseFetch('/creators?platform=eq.youtube&select=*')
}

async function updateCreator(id, data) {
  return supabaseFetch(`/creators?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  })
}

async function upsertPost(post) {
  return supabaseFetch('/feed_items?on_conflict=platform_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(post),
  })
}

async function countPostsByCreator(creatorId) {
  const rows = await supabaseFetch(`/feed_items?creator_id=eq.${creatorId}&select=platform_id`)
  return rows?.length ?? 0
}

// ── Apify helpers ─────────────────────────────────────────────────────────────

async function apifyRun(actorId, input) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${APIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify ${actorId} → ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Storage helpers ───────────────────────────────────────────────────────────

async function uploadToStorage(sourceUrl, storagePath) {
  try {
    const dl = await fetch(sourceUrl)
    if (!dl.ok) return null
    const buffer = await dl.arrayBuffer()
    const contentType = dl.headers.get('content-type') || 'image/jpeg'

    const up = await fetch(
      `${SUPABASE_URL}/storage/v1/object/post-media/${storagePath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer,
      }
    )
    if (!up.ok) {
      const text = await up.text()
      console.warn(`  Upload failed (${up.status}): ${text}`)
      return null
    }
    return `${SUPABASE_URL}/storage/v1/object/public/post-media/${storagePath}`
  } catch (e) {
    console.warn(`  Upload error: ${e.message}`)
    return null
  }
}

// ── Transcript helper ─────────────────────────────────────────────────────────

async function fetchTranscript(videoUrl) {
  try {
    const results = await apifyRun(APIFY_TRANSCRIPT_ACTOR, {
      channelIDBoolean: true,
      channelNameBoolean: true,
      commentsBoolean: false,
      datePublishedBoolean: true,
      dateTextBoolean: false,
      descriptionBoolean: false,
      keywordsBoolean: false,
      likesBoolean: true,
      maxRetries: 8,
      proxyOptions: {
        useApifyProxy: true,
        apifyProxyGroups: ['BUYPROXIES94952'],
      },
      relativeDateTextBoolean: false,
      thumbnailBoolean: false,
      urls: [videoUrl],
      viewCountBoolean: true,
    })
    const item = results?.[0]
    if (!item) return null

    // Transcript is typically an array of { text, start, duration } segments
    // Join into a single string
    if (Array.isArray(item.transcript)) {
      return item.transcript.map((s) => s.text).join(' ').trim() || null
    }
    if (typeof item.transcript === 'string') {
      return item.transcript.trim() || null
    }
    return null
  } catch (e) {
    console.warn(`  ✗ Transcript fetch failed: ${e.message}`)
    return null
  }
}

// ── Duration helpers ──────────────────────────────────────────────────────────

// Returns duration in seconds from common formats:
//   number (seconds), "HH:MM:SS", "MM:SS", "PT1H30M45S"
function parseDurationSeconds(raw) {
  if (raw == null) return null
  if (typeof raw === 'number') return raw

  const str = String(raw).trim()

  // ISO 8601: PT1H30M45S
  if (str.startsWith('PT')) {
    const h = str.match(/(\d+)H/)?.[1] ?? 0
    const m = str.match(/(\d+)M/)?.[1] ?? 0
    const s = str.match(/(\d+)S/)?.[1] ?? 0
    return Number(h) * 3600 + Number(m) * 60 + Number(s)
  }

  // HH:MM:SS or MM:SS
  const parts = str.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]

  return null
}

const MAX_DURATION_SECONDS = 40 * 60 // 40 minutes

// ── Main ──────────────────────────────────────────────────────────────────────

function deriveHandle(profileUrl) {
  try {
    const pathname = new URL(profileUrl).pathname
    const segment = pathname.split('/').filter(Boolean).pop() ?? ''
    // Preserve @handle or channel/UCxxx as-is
    return segment.startsWith('@') ? segment : `@${segment}`
  } catch {
    return profileUrl
  }
}

async function processCreator(creator) {
  console.log(`\n▶ ${creator.name} (${creator.handle})`)

  // 1. Scrape channel videos
  let videos
  try {
    // Normalize URL — strip trailing /videos, /shorts, etc. and trailing slash
    const channelUrl = creator.profile_url
      .replace(/\/(videos|shorts|playlists|about)\/?$/, '')
      .replace(/\/$/, '')
    videos = await apifyRun(APIFY_CHANNEL_ACTOR, {
      channelUrls: [channelUrl],
      maxVideos: 3,
    })
  } catch (e) {
    console.warn(`  ✗ Channel scrape failed: ${e.message}`)
    return
  }

  if (!videos?.length) {
    console.log('  No videos returned')
    return
  }

  console.log(`  ${videos.length} videos scraped`)

  // 2. Extract subscriber count — nested in aboutChannelInfo
  const firstVideo = videos[0]
  const subscriberCount =
    firstVideo.aboutChannelInfo?.numberOfSubscribers ??
    firstVideo.subscriberCount ??
    firstVideo.numberOfSubscribers ??
    null

  let upsertedCount = 0

  // 3. Process each video
  for (const video of videos) {
    // videoId can be at video.id or derived from video.url
    const videoId =
      video.id ??
      video.videoId ??
      (() => {
        try {
          return new URL(video.url ?? '').searchParams.get('v')
        } catch {
          return null
        }
      })()

    if (!videoId) {
      console.warn('  ✗ Could not determine video ID, skipping')
      continue
    }

    // Skip videos over 40 minutes
    const durationRaw = video.duration ?? video.durationSeconds ?? video.lengthSeconds ?? null
    const durationSec = parseDurationSeconds(durationRaw)
    if (durationSec != null && durationSec > MAX_DURATION_SECONDS) {
      console.log(`  ⏭ Skipping ${videoId} — duration ${Math.round(durationSec / 60)}min > 40min`)
      continue
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Upload thumbnail to Supabase Storage
    const srcThumbnail =
      video.thumbnailUrl ??
      video.thumbnail ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

    let thumbnailUrl = null
    if (srcThumbnail) {
      console.log(`  ↑ Uploading thumbnail for ${videoId}`)
      thumbnailUrl = await uploadToStorage(
        srcThumbnail,
        `youtube/${videoId}/thumbnail.jpg`
      )
    }

    // Fetch transcript
    console.log(`  ↓ Fetching transcript for ${videoId}`)
    const transcript = await fetchTranscript(videoUrl)

    // Upsert to feed_items
    try {
      await upsertPost({
        platform_id: videoId,
        platform: 'youtube',
        author:
          video.channelName ??
          video.channel ??
          creator.name,
        handle: deriveHandle(creator.profile_url),
        title: video.title ?? null,
        body: transcript ?? '',
        post_url: videoUrl,
        likes: video.likes ?? video.likeCount ?? 0,
        comments_count: video.commentsCount ?? video.commentCount ?? 0,
        shares_count: 0,
        views_count: video.viewCount ?? video.views ?? 0,
        image_urls: [],
        video_urls: [],
        thumbnail_url: thumbnailUrl,
        tags: [],
        relevance: 0,
        creator_id: creator.id,
        created_at: video.datePublished ?? video.publishedAt ?? null,
        scraped_at: new Date().toISOString(),
      })
      upsertedCount++
      console.log(`  ✓ Upserted video ${videoId}${transcript ? ' (with transcript)' : ''}`)
    } catch (e) {
      console.warn(`  ✗ Upsert failed for ${videoId}: ${e.message}`)
    }
  }

  // 4. Update creator metadata with real DB count
  try {
    const realCount = await countPostsByCreator(creator.id)
    await updateCreator(creator.id, {
      ...(subscriberCount != null ? { followers: String(subscriberCount) } : {}),
      last_scraped: new Date().toISOString(),
      posts_scraped: realCount,
    })
    console.log(`  ↺ posts_scraped → ${realCount}`)
    if (subscriberCount != null) console.log(`  ↺ Subscribers updated: ${subscriberCount}`)
  } catch (e) {
    console.warn(`  ✗ Creator update failed: ${e.message}`)
  }
}

async function main() {
  console.log('YouTube scraping started', new Date().toISOString())

  let creators = await getYouTubeCreators()
  if (CREATOR_ID) {
    creators = creators.filter((c) => c.id === CREATOR_ID)
    if (!creators.length) {
      console.log(`No YouTube creator found with id ${CREATOR_ID}`)
      return
    }
  }
  console.log(`Found ${creators.length} YouTube creators`)

  for (const creator of creators) {
    await processCreator(creator)
  }

  console.log('\n✅ Done', new Date().toISOString())
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
