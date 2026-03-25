import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const APIFY_TOKEN = process.env.APIFY_TOKEN

const APIFY_REDDIT_ACTOR = 'TwqHBuZZPHJxiQrTU'

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

async function getRedditCreators() {
  return supabaseFetch('/creators?platform=eq.reddit&select=*')
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

// ── Media extraction (mirrors n8n Map Fields node) ───────────────────────────

function extractImageUrl(post) {
  const assets = post.media_assets || []
  if (assets.length > 0 && assets[0].original_url) {
    return assets[0].original_url
  }
  if (post.preview?.images?.[0]?.source?.url) {
    // Reddit HTML-encodes the URL in preview — decode it
    return post.preview.images[0].source.url.replace(/&amp;/g, '&')
  }
  if (post.url_overridden_by_dest?.includes('i.redd.it')) {
    return post.url_overridden_by_dest
  }
  return null
}

function extractVideoUrl(post) {
  return post.media?.reddit_video?.fallback_url ?? null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function processCreator(creator) {
  // handle is stored as "r/SubredditName" — strip the "r/" prefix for Apify
  const subredditName = creator.handle.replace(/^r\//i, '')
  console.log(`\n▶ ${creator.name} (r/${subredditName})`)

  // 1. Scrape posts
  let posts
  try {
    posts = await apifyRun(APIFY_REDDIT_ACTOR, {
      includeNsfw: false,
      maxPosts: 20,
      scrapeComments: false,
      subredditName,
      subredditSort: 'hot',
      subredditTimeframe: 'day',
    })
  } catch (e) {
    console.warn(`  ✗ Posts scrape failed: ${e.message}`)
    return
  }

  console.log(`  ${posts.length} posts scraped`)

  let upsertedCount = 0

  // 2. Process each post
  for (const post of posts) {
    const postId = post.id
    if (!postId) continue

    const srcImageUrl = extractImageUrl(post)
    const srcVideoUrl = extractVideoUrl(post)

    // Upload image to Supabase Storage
    const imageUrls = []
    if (srcImageUrl) {
      console.log(`  ↑ Uploading image for post ${postId}`)
      const ext = srcImageUrl.includes('.png') ? 'png' : 'jpg'
      const url = await uploadToStorage(srcImageUrl, `reddit/${postId}/img_0.${ext}`)
      if (url) imageUrls.push(url)
    }

    // Upload video to Supabase Storage
    const videoUrls = []
    if (srcVideoUrl) {
      console.log(`  ↑ Uploading video for post ${postId}`)
      const url = await uploadToStorage(srcVideoUrl, `reddit/${postId}/video_0.mp4`)
      if (url) videoUrls.push(url)
    }

    // Upsert post to feed_items
    try {
      await upsertPost({
        platform_id: postId,
        platform: 'reddit',
        author: post.author ?? 'unknown',
        handle: `r/${post.subreddit ?? subredditName}`,
        title: post.title ?? null,
        body: post.selftext ?? post.body ?? '',
        post_url: post.url ?? null,
        subreddit: post.subreddit ?? subredditName,
        likes: post.score ?? 0,
        comments_count: post.num_comments ?? 0,
        shares_count: 0,
        views_count: 0,
        image_urls: imageUrls,
        video_urls: videoUrls,
        thumbnail_url: imageUrls[0] ?? null,
        creator_id: creator.id,
        created_at: post.created_utc
          ? typeof post.created_utc === 'number'
            ? new Date(post.created_utc * 1000).toISOString()
            : new Date(post.created_utc).toISOString()
          : null,
        scraped_at: new Date().toISOString(),
      })
      upsertedCount++
      console.log(
        `  ✓ Upserted post ${postId} (${imageUrls.length} images, ${videoUrls.length} videos)`
      )
    } catch (e) {
      console.warn(`  ✗ Upsert failed for ${postId}: ${e.message}`)
    }
  }

  // 3. Update creator's last_scraped, posts_scraped, and member count
  const memberCount = posts[0]?.subreddit_subscribers ?? null
  try {
    const realCount = await countPostsByCreator(creator.id)
    await updateCreator(creator.id, {
      last_scraped: new Date().toISOString(),
      posts_scraped: realCount,
      ...(memberCount != null ? { followers: String(memberCount) } : {}),
    })
    console.log(`  ↺ posts_scraped → ${realCount}`)
    if (memberCount != null) console.log(`  ↺ Members updated: ${memberCount}`)
  } catch (e) {
    console.warn(`  ✗ Creator update failed: ${e.message}`)
  }
}

async function main() {
  console.log('Reddit scraping started', new Date().toISOString())

  const creators = await getRedditCreators()
  console.log(`Found ${creators.length} Reddit creators`)

  for (const creator of creators) {
    await processCreator(creator)
  }

  console.log('\n✅ Done', new Date().toISOString())
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
