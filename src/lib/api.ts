import { supabase } from './supabase'

export async function fetchFeedItems(platform?: string) {
  let query = supabase
    .from('feed_items')
    .select('*')
    .eq('is_hidden', false)
    .order('scraped_at', { ascending: false })
  if (platform && platform !== 'all') {
    query = query.eq('platform', platform)
  }
  return await query
}

export async function fetchBookmarks(platform?: string) {
  let query = supabase
    .from('feed_items')
    .select('*')
    .eq('is_bookmarked', true)
    .eq('is_hidden', false)
    .order('scraped_at', { ascending: false })
  if (platform && platform !== 'all') {
    query = query.eq('platform', platform)
  }
  return await query
}

export async function fetchArchived() {
  return await supabase
    .from('feed_items')
    .select('*')
    .eq('is_hidden', true)
    .order('scraped_at', { ascending: false })
}

export async function toggleBookmark(platformId: string, current: boolean) {
  return await supabase
    .from('feed_items')
    .update({ is_bookmarked: !current })
    .eq('platform_id', platformId)
    .select()
    .single()
}

export async function hidePost(platformId: string) {
  return await supabase
    .from('feed_items')
    .update({ is_hidden: true })
    .eq('platform_id', platformId)
    .select()
    .single()
}

export async function restorePost(platformId: string) {
  return await supabase
    .from('feed_items')
    .update({ is_hidden: false })
    .eq('platform_id', platformId)
    .select()
    .single()
}

export async function deletePost(platformId: string) {
  return await supabase
    .from('feed_items')
    .delete()
    .eq('platform_id', platformId)
}

export async function deleteAllArchived() {
  return await supabase
    .from('feed_items')
    .delete()
    .eq('is_hidden', true)
}

export async function deleteCreator(id: string) {
  return await supabase.from('creators').delete().eq('id', id)
}

export async function fetchCreators() {
  return await supabase
    .from('creators')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function addCreator(creator: {
  name: string
  handle: string
  platform: string
  profile_url: string
  avatar_color: string
}) {
  return await supabase.from('creators').insert(creator).select().single()
}

export async function fetchTrending() {
  return await supabase
    .from('trending_topics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)
}

export async function fetchIdeationItems() {
  return await supabase
    .from('ideation_items')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function saveDraft(draft: {
  ideation_item_id?: string
  platform: string
  content: string
}) {
  return await supabase.from('content_drafts').insert(draft).select().single()
}

export async function fetchDrafts() {
  return await supabase
    .from('content_drafts')
    .select('*')
    .order('created_at', { ascending: false })
}
