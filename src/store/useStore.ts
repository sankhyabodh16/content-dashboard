import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { FeedItem, Creator, TrendingTopic, ContentIdea, Platform } from '../types'
import { PLATFORM_COLORS } from '../lib/tokens'
import { isSupabaseConfigured } from '../lib/supabase'
import * as api from '../lib/api'

interface AppState {
  // Data
  feedItems: FeedItem[]
  creators: Creator[]
  trending: TrendingTopic[]
  contentIdeas: ContentIdea[]

  // UI state
  activeFilter: Platform[]
  isLoading: boolean

  // Init
  initialize: () => Promise<void>

  // Feed mutations
  toggleLibrary: (id: string) => Promise<void>
  hidePost: (id: string) => Promise<void>
  restorePost: (id: string) => Promise<void>
  clearFeed: () => Promise<void>
  clearArchive: () => Promise<void>

  // Creator mutations
  addCreator: (creator: Omit<Creator, 'id' | 'created_at' | 'updated_at' | 'avatar_color' | 'followers' | 'posts_scraped' | 'last_scraped'>) => Promise<void>
  removeCreator: (id: string) => Promise<void>
  updateCreator: (id: string, patch: Pick<Creator, 'name' | 'handle' | 'profile_url'>) => Promise<void>

  // Content idea mutations
  createIdea: (source_platform_id: string | null) => Promise<ContentIdea | null>
  updateIdea: (id: string, patch: Partial<Pick<ContentIdea, 'title' | 'outline' | 'source_platform_id'>>) => Promise<void>
  deleteIdea: (id: string) => Promise<void>

  // UI actions
  setFilter: (filter: Platform | 'all') => void
  toggleFilter: (filter: Platform | 'all') => void
}

export const useStore = create<AppState>((set, get) => ({
  feedItems: [],
  creators: [],
  trending: [],
  contentIdeas: [],
  activeFilter: [],
  isLoading: false,

  initialize: async () => {
    if (get().feedItems.length > 0) return // Already loaded — skip

    if (!isSupabaseConfigured) {
      // Supabase credentials not set — start with empty state
      set({ isLoading: false })
      return
    }

    set({ isLoading: true })

    const [feedRes, creatorsRes, trendingRes, ideasRes] = await Promise.all([
      api.fetchFeedItems(),
      api.fetchCreators(),
      api.fetchTrending(),
      api.fetchContentIdeas(),
    ])

    set({
      feedItems: feedRes.data ?? [],
      creators: creatorsRes.data ?? [],
      trending: trendingRes.data ?? [],
      contentIdeas: (ideasRes.data as ContentIdea[] | null) ?? [],
      isLoading: false,
    })
  },

  toggleLibrary: async (platformId) => {
    const item = get().feedItems.find((i) => i.platform_id === platformId)
    if (!item) return

    const prevBookmarked = item.is_bookmarked
    const prevTags = item.tags ?? []
    const nextBookmarked = !prevBookmarked

    let nextTags: string[]
    if (nextBookmarked) {
      // Adding to library — tag as yet-to-ideate (dedup)
      nextTags = prevTags.includes('yet-to-ideate') ? prevTags : [...prevTags, 'yet-to-ideate']
    } else {
      // Removing from library — strip both state tags
      nextTags = prevTags.filter((t) => t !== 'yet-to-ideate' && t !== 'ideation-complete')
    }

    // Optimistic update
    set((state) => ({
      feedItems: state.feedItems.map((i) =>
        i.platform_id === platformId ? { ...i, is_bookmarked: nextBookmarked, tags: nextTags } : i
      ),
    }))

    if (!isSupabaseConfigured) return

    const { error } = await api.toggleBookmark(platformId, nextBookmarked, nextTags)
    if (error) {
      // Revert
      set((state) => ({
        feedItems: state.feedItems.map((i) =>
          i.platform_id === platformId ? { ...i, is_bookmarked: prevBookmarked, tags: prevTags } : i
        ),
      }))
    }
  },

  hidePost: async (platformId) => {
    // Optimistic update
    set((state) => ({
      feedItems: state.feedItems.map((i) =>
        i.platform_id === platformId ? { ...i, is_hidden: true } : i
      ),
    }))

    if (!isSupabaseConfigured) return

    const { error } = await api.hidePost(platformId)
    if (error) {
      // Revert
      set((state) => ({
        feedItems: state.feedItems.map((i) =>
          i.platform_id === platformId ? { ...i, is_hidden: false } : i
        ),
      }))
    }
  },

  restorePost: async (platformId) => {
    // Optimistic update
    set((state) => ({
      feedItems: state.feedItems.map((i) =>
        i.platform_id === platformId ? { ...i, is_hidden: false } : i
      ),
    }))

    if (!isSupabaseConfigured) return

    const { error } = await api.restorePost(platformId)
    if (error) {
      // Revert
      set((state) => ({
        feedItems: state.feedItems.map((i) =>
          i.platform_id === platformId ? { ...i, is_hidden: true } : i
        ),
      }))
    }
  },

  clearFeed: async () => {
    const toHide = get().feedItems
      .filter((i) => !i.is_hidden)
      .map((i) => i.platform_id)

    // Optimistic update — hide everything (including bookmarked/list items)
    set((state) => ({
      feedItems: state.feedItems.map((item) => ({ ...item, is_hidden: true })),
    }))

    if (!isSupabaseConfigured) return

    // Fire all hide calls in parallel
    await Promise.all(toHide.map((id) => api.hidePost(id)))
  },

  clearArchive: async () => {
    // Optimistic update — remove all hidden items from local state
    set((state) => ({
      feedItems: state.feedItems.filter((i) => !i.is_hidden),
    }))

    if (!isSupabaseConfigured) return
    await api.deleteAllArchived()
  },

  addCreator: async (creator) => {
    const avatarColor = PLATFORM_COLORS[creator.platform] ?? '#666666'
    const tempId = `temp_${Date.now()}`
    const tempCreator: Creator = {
      ...creator,
      id: tempId,
      avatar_color: avatarColor,
      followers: '0',
      posts_scraped: 0,
      last_scraped: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Optimistic update
    set((state) => ({ creators: [tempCreator, ...state.creators] }))

    if (!isSupabaseConfigured) return

    const { data, error } = await api.addCreator({
      name: creator.name,
      handle: creator.handle,
      platform: creator.platform,
      profile_url: creator.profile_url ?? '',
      avatar_color: avatarColor,
    })

    if (error || !data) {
      // Revert
      set((state) => ({ creators: state.creators.filter((c) => c.id !== tempId) }))
    } else {
      // Replace temp with real row
      set((state) => ({
        creators: state.creators.map((c) => (c.id === tempId ? (data as Creator) : c)),
      }))
    }
  },

  removeCreator: async (id) => {
    // Optimistic update
    set((state) => ({ creators: state.creators.filter((c) => c.id !== id) }))

    if (!isSupabaseConfigured) return

    const { error } = await api.deleteCreator(id)
    if (error) {
      // Revert — re-fetch to restore accurate state
      const { data } = await api.fetchCreators()
      if (data) set({ creators: data as Creator[] })
    }
  },

  updateCreator: async (id, patch) => {
    const prev = get().creators.find((c) => c.id === id)
    if (!prev) return

    // Optimistic update
    set((state) => ({
      creators: state.creators.map((c) =>
        c.id === id ? { ...c, ...patch, updated_at: new Date().toISOString() } : c
      ),
    }))

    if (!isSupabaseConfigured) return

    const { error } = await api.updateCreator(id, {
      name: patch.name,
      handle: patch.handle,
      profile_url: patch.profile_url,
    })
    if (error) {
      // Revert
      set((state) => ({
        creators: state.creators.map((c) => (c.id === id ? prev : c)),
      }))
    }
  },

  createIdea: async (source_platform_id) => {
    const now = new Date().toISOString()
    const tempId = `temp_${Date.now()}`
    const draft: ContentIdea = {
      id: tempId,
      title: '',
      outline: '',
      source_platform_id,
      created_at: now,
      updated_at: now,
    }

    set((state) => ({ contentIdeas: [draft, ...state.contentIdeas] }))

    if (!isSupabaseConfigured) return draft

    const { data, error } = await api.createContentIdea({
      title: '',
      outline: '',
      source_platform_id,
    })

    if (error || !data) {
      set((state) => ({ contentIdeas: state.contentIdeas.filter((i) => i.id !== tempId) }))
      return null
    }

    const real = data as ContentIdea
    set((state) => ({
      contentIdeas: state.contentIdeas.map((i) => (i.id === tempId ? real : i)),
    }))
    return real
  },

  updateIdea: async (id, patch) => {
    const prev = get().contentIdeas.find((i) => i.id === id)
    if (!prev) return

    set((state) => ({
      contentIdeas: state.contentIdeas.map((i) =>
        i.id === id ? { ...i, ...patch, updated_at: new Date().toISOString() } : i
      ),
    }))

    if (!isSupabaseConfigured) return
    if (id.startsWith('temp_')) return

    const { error } = await api.updateContentIdea(id, patch)
    if (error) {
      set((state) => ({
        contentIdeas: state.contentIdeas.map((i) => (i.id === id ? prev : i)),
      }))
    }
  },

  deleteIdea: async (id) => {
    const prev = get().contentIdeas
    set((state) => ({ contentIdeas: state.contentIdeas.filter((i) => i.id !== id) }))

    if (!isSupabaseConfigured) return
    if (id.startsWith('temp_')) return

    const { error } = await api.deleteContentIdea(id)
    if (error) {
      set({ contentIdeas: prev })
    }
  },

  setFilter: (filter) => set({ activeFilter: filter === 'all' ? [] : [filter] }),

  toggleFilter: (filter) => {
    if (filter === 'all') {
      set({ activeFilter: [] })
      return
    }
    const current = get().activeFilter
    const next = current.includes(filter)
      ? current.filter((f) => f !== filter)
      : [...current, filter]
    set({ activeFilter: next })
  },
}))

// Re-export useShallow for convenience
export { useShallow }
