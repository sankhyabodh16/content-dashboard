import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { FeedItem, Creator, TrendingTopic, Platform, IdeationItem } from '../types'
import { PLATFORM_COLORS } from '../lib/tokens'
import { isSupabaseConfigured } from '../lib/supabase'
import * as api from '../lib/api'

interface AppState {
  // Data
  feedItems: FeedItem[]
  creators: Creator[]
  trending: TrendingTopic[]
  ideationItems: IdeationItem[]
  activeIdeation: IdeationItem | null

  // UI state
  activeFilter: Platform | 'all'
  isLoading: boolean

  // Init
  initialize: () => Promise<void>

  // Feed mutations
  toggleList: (id: string) => Promise<void>
  hidePost: (id: string) => Promise<void>
  restorePost: (id: string) => Promise<void>
  clearFeed: () => Promise<void>
  clearArchive: () => Promise<void>

  // Creator mutations
  addCreator: (creator: Omit<Creator, 'id' | 'created_at' | 'updated_at' | 'avatar_color' | 'followers' | 'posts_scraped' | 'last_scraped'>) => Promise<void>
  removeCreator: (id: string) => Promise<void>
  updateCreator: (id: string, patch: Pick<Creator, 'name' | 'handle' | 'profile_url'>) => Promise<void>

  // UI actions
  setFilter: (filter: Platform | 'all') => void
  setActiveIdeation: (item: IdeationItem | null) => void
}

export const useStore = create<AppState>((set, get) => ({
  feedItems: [],
  creators: [],
  trending: [],
  ideationItems: [],
  activeIdeation: null,
  activeFilter: 'all',
  isLoading: false,

  initialize: async () => {
    if (get().feedItems.length > 0) return // Already loaded — skip

    if (!isSupabaseConfigured) {
      // Supabase credentials not set — start with empty state
      set({ isLoading: false })
      return
    }

    set({ isLoading: true })

    const [feedRes, creatorsRes, trendingRes, ideationRes] = await Promise.all([
      api.fetchFeedItems(),
      api.fetchCreators(),
      api.fetchTrending(),
      api.fetchIdeationItems(),
    ])

    set({
      feedItems: feedRes.data ?? [],
      creators: creatorsRes.data ?? [],
      trending: trendingRes.data ?? [],
      ideationItems: ideationRes.data ?? [],
      isLoading: false,
    })
  },

  toggleList: async (platformId) => {
    const item = get().feedItems.find((i) => i.platform_id === platformId)
    if (!item) return

    const prev = item.is_bookmarked

    // Optimistic update
    set((state) => ({
      feedItems: state.feedItems.map((i) =>
        i.platform_id === platformId ? { ...i, is_bookmarked: !prev } : i
      ),
    }))

    if (!isSupabaseConfigured) return

    const { error } = await api.toggleBookmark(platformId, prev)
    if (error) {
      // Revert
      set((state) => ({
        feedItems: state.feedItems.map((i) =>
          i.platform_id === platformId ? { ...i, is_bookmarked: prev } : i
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
      .filter((i) => !i.is_bookmarked && !i.is_hidden)
      .map((i) => i.platform_id)

    // Optimistic update
    set((state) => ({
      feedItems: state.feedItems.map((item) =>
        item.is_bookmarked ? item : { ...item, is_hidden: true }
      ),
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

  setFilter: (filter) => set({ activeFilter: filter }),

  setActiveIdeation: (item) => set({ activeIdeation: item }),
}))

// Re-export useShallow for convenience
export { useShallow }
