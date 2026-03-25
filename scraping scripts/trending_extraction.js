import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

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

async function getRecentFeedItems() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  return supabaseFetch(
    `/feed_items?is_hidden=eq.false&scraped_at=gte.${since}&select=platform_id,platform,title,body&order=scraped_at.desc&limit=200`
  )
}

async function clearTrendingTopics() {
  // Delete all existing trending topics before inserting fresh ones
  return supabaseFetch('/trending_topics', {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
}

async function insertTrendingTopics(topics) {
  return supabaseFetch('/trending_topics', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(topics),
  })
}

// ── Claude extraction ─────────────────────────────────────────────────────────

async function extractTrending(items) {
  // Build a compact summary of titles per platform
  const byPlatform = {}
  for (const item of items) {
    if (!byPlatform[item.platform]) byPlatform[item.platform] = []
    const text = [item.title, item.body].filter(Boolean).join(' ').slice(0, 300)
    byPlatform[item.platform].push(text)
  }

  const content = Object.entries(byPlatform)
    .map(([platform, texts]) => `[${platform}]\n${texts.join('\n')}`)
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a content analyst. Analyze these social media posts and extract trending topics.

Posts (grouped by platform):
${content}

Return a JSON array of trending topics. Each topic must have:
- "topic": 1-2 words MAX (the trending keyword or phrase)
- "category": broad category (e.g. "AI", "Finance", "Marketing", "Tech", "Health")
- "platform": the platform it came from (linkedin/reddit/youtube/twitter/instagram) or null if cross-platform

Extract 8-12 topics total. Only return raw JSON, no markdown, no explanation.

Example: [{"topic":"Claude AI","category":"AI","platform":"reddit"},{"topic":"SEO","category":"Marketing","platform":"linkedin"}]`,
      },
    ],
  })

  const raw = message.content[0].text.trim()
  return JSON.parse(raw)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Trending extraction started', new Date().toISOString())

  const items = await getRecentFeedItems()
  console.log(`${items.length} feed items from last 24h`)

  if (items.length === 0) {
    console.log('No items to process')
    return
  }

  let topics
  try {
    topics = await extractTrending(items)
    console.log(`Claude extracted ${topics.length} trending topics`)
  } catch (e) {
    console.error('Claude extraction failed:', e.message)
    process.exit(1)
  }

  // Clear old topics and insert fresh ones
  await clearTrendingTopics()
  await insertTrendingTopics(topics)

  topics.forEach((t) => console.log(`  • [${t.platform ?? 'all'}] ${t.category} → ${t.topic}`))
  console.log('\n✅ Done', new Date().toISOString())
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
