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

async function getBookmarkedItems() {
  return supabaseFetch(
    '/feed_items?is_bookmarked=eq.true&is_hidden=eq.false&select=platform_id,platform,title,body,author&order=scraped_at.desc&limit=100'
  )
}

async function getExistingSourceIds() {
  const rows = await supabaseFetch('/ideation_items?select=source_item_ids')
  return new Set((rows ?? []).flatMap((r) => r.source_item_ids ?? []))
}

async function insertIdeationItems(items) {
  return supabaseFetch('/ideation_items', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(items),
  })
}

// ── Claude extraction ─────────────────────────────────────────────────────────

async function extractIdeation(items) {
  const content = items
    .map(
      (item, i) =>
        `[${i}] platform_id:${item.platform_id} platform:${item.platform} author:${item.author}\nTitle: ${item.title ?? ''}\nBody: ${(item.body ?? '').slice(0, 400)}`
    )
    .join('\n\n---\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a content strategist. Analyze these bookmarked social media posts and identify content opportunities.

Bookmarked posts:
${content}

Group related posts into content ideas. For each idea return:
- "topic": short punchy title (max 8 words)
- "outline": 4-6 bullet points covering angle, key points, and a hook (each bullet max 15 words)
- "platform": best platform to publish on (linkedin/reddit/youtube/twitter/instagram)
- "source_item_ids": array of platform_id strings from the posts you used

Generate 3-6 ideation items. Combine posts that share a theme. Only return raw JSON array, no markdown.

Example:
[{"topic":"Why AI Agents Are Replacing Junior Devs","outline":"• Hook: most devs don't see it coming\\n• What agents can do today\\n• 3 real examples from the feed\\n• What skills still matter\\n• Call to action","platform":"linkedin","source_item_ids":["abc123","def456"]}]`,
      },
    ],
  })

  const raw = message.content[0].text.trim()
  return JSON.parse(raw)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Ideation extraction started', new Date().toISOString())

  const items = await getBookmarkedItems()
  console.log(`${items.length} bookmarked feed items`)

  if (items.length === 0) {
    console.log('No bookmarked items to process')
    return
  }

  // Filter out items already used in existing ideation
  const usedIds = await getExistingSourceIds()
  const newItems = items.filter((item) => !usedIds.has(item.platform_id))
  console.log(`${newItems.length} items not yet in ideation`)

  if (newItems.length === 0) {
    console.log('All bookmarked items already have ideation entries')
    return
  }

  let ideationItems
  try {
    ideationItems = await extractIdeation(newItems)
    console.log(`Claude generated ${ideationItems.length} ideation items`)
  } catch (e) {
    console.error('Claude extraction failed:', e.message)
    process.exit(1)
  }

  // Add status field before inserting
  const toInsert = ideationItems.map((item) => ({ ...item, status: 'idea' }))
  await insertIdeationItems(toInsert)

  ideationItems.forEach((item) =>
    console.log(`  • [${item.platform}] ${item.topic} (${item.source_item_ids.length} sources)`)
  )
  console.log('\n✅ Done', new Date().toISOString())
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
