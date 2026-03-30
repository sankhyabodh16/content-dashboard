import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const APIFY_TOKEN = process.env.APIFY_TOKEN

const APIFY_ACCOUNT_ACTOR = 'VhxlqQXRwhW8H5hNV'
const APIFY_POSTS_ACTOR = 'Wpp1BZ6yGWjySadk3'
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

async function getLinkedInCreators() {
  return supabaseFetch('/creators?platform=eq.linkedin&select=*')
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function processCreator(creator) {
  const username = creator.handle.replace('@', '')
  console.log(`\n▶ ${creator.name} (@${username})`)

  // 1. Update follower/connection counts
  try {
    const [accountInfo] = await apifyRun(APIFY_ACCOUNT_ACTOR, {
      includeEmail: false,
      username,
    })
    if (accountInfo?.basic_info) {
      await updateCreator(creator.id, {
        followers: String(accountInfo.basic_info.follower_count ?? '0'),
        connection_count: accountInfo.basic_info.connection_count,
        last_scraped: new Date().toISOString(),
      })
      console.log(`  ✓ Updated account info`)
    }
  } catch (e) {
    console.warn(`  ✗ Account info failed: ${e.message}`)
  }

  // 2. Scrape posts
  let posts
  try {
    posts = await apifyRun(APIFY_POSTS_ACTOR, {
      deepScrape: true,
      limitPerSource: 5,
      rawData: false,
      urls: [creator.profile_url],
    })
  } catch (e) {
    console.warn(`  ✗ Posts scrape failed: ${e.message}`)
    return
  }

  // 3. Filter out activity posts
  const originalPosts = posts.filter((p) => p.isActivity === false)
  console.log(`  ${originalPosts.length} posts to process`)

  // 4. Process each post
  for (const post of originalPosts) {
    const postId = post.urn?.split(':').pop()
    if (!postId) continue

    // Collect source media URLs
    const srcImages =
      post.type === 'image'
        ? post.images || []
        : post.type === 'document'
        ? post.document?.coverPages || []
        : []

    const srcVideo =
      post.type === 'linkedinVideo'
        ? post.linkedinVideo?.videoPlayMetadata?.progressiveStreams?.[0]
            ?.streamingLocations?.[0]?.url ?? null
        : null

    // Upload images
    const imageUrls = []
    for (let i = 0; i < srcImages.length; i++) {
      console.log(`  ↑ Uploading image ${i + 1}/${srcImages.length} for post ${postId}`)
      const url = await uploadToStorage(srcImages[i], `${postId}/img_${i}.jpg`)
      if (url) imageUrls.push(url)
    }

    // Upload video
    const videoUrls = []
    if (srcVideo) {
      console.log(`  ↑ Uploading video for post ${postId}`)
      const url = await uploadToStorage(srcVideo, `${postId}/video_0.mp4`)
      if (url) videoUrls.push(url)
    }

    // Upsert post
    try {
      await upsertPost({
        platform_id: postId,
        platform: 'linkedin',
        author: post.authorName,
        handle: creator.handle,
        body: post.text ?? '',
        post_url: post.url,
        likes: post.numLikes ?? 0,
        comments_count: post.numComments ?? 0,
        shares_count: post.numShares ?? 0,
        views_count: 0,
        image_urls: imageUrls,
        video_urls: videoUrls,
        tags: [],
        relevance: 0,
        creator_id: creator.id,
        created_at: post.postedAtISO || null,
        scraped_at: new Date().toISOString(),
      })
      console.log(`  ✓ Upserted post ${postId} (${imageUrls.length} images, ${videoUrls.length} videos)`)
    } catch (e) {
      console.warn(`  ✗ Upsert failed for ${postId}: ${e.message}`)
    }
  }

  // Update posts_scraped with real DB count
  try {
    const realCount = await countPostsByCreator(creator.id)
    await updateCreator(creator.id, { posts_scraped: realCount })
    console.log(`  ↺ posts_scraped → ${realCount}`)
  } catch (e) {
    console.warn(`  ✗ posts_scraped update failed: ${e.message}`)
  }
}

async function main() {
  console.log('LinkedIn scraping started', new Date().toISOString())

  let creators = await getLinkedInCreators()
  if (CREATOR_ID) {
    creators = creators.filter((c) => c.id === CREATOR_ID)
    if (!creators.length) {
      console.log(`No LinkedIn creator found with id ${CREATOR_ID}`)
      return
    }
  }
  console.log(`Found ${creators.length} LinkedIn creators`)

  for (const creator of creators) {
    await processCreator(creator)
  }

  console.log('\n✅ Done', new Date().toISOString())
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
