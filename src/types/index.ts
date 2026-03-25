export type Platform = 'linkedin' | 'reddit' | 'twitter' | 'youtube' | 'instagram'

export interface FeedItem {
  platform_id: string
  platform: Platform
  author: string
  handle: string | null
  title: string | null
  body: string
  post_url: string | null
  likes: number
  comments_count: number
  shares_count: number
  views_count: number
  image_urls: string[]
  video_urls: string[]
  thumbnail_url: string | null
  subreddit: string | null
  creator_id: string | null
  is_hidden: boolean
  is_bookmarked: boolean
  tags: string[]
  relevance: number
  scraped_at: string
  created_at: string
}

export interface Creator {
  id: string
  name: string
  handle: string
  platform: Platform
  profile_url: string | null
  avatar_color: string
  followers: string
  connection_count: number | null
  posts_scraped: number
  last_scraped: string | null
  created_at: string
  updated_at: string
  // Platform-specific metrics (e.g. connections for LinkedIn, following for Instagram)
  metrics?: Record<string, string>
}

export interface TrendingTopic {
  id: string
  category: string
  topic: string
  platform: string | null
  created_at: string
}

export interface IdeationItem {
  id: string
  topic: string
  outline: string
  source_item_ids: string[]
  status: 'idea' | 'writing' | 'drafted' | 'published'
  platform: Platform | null
  created_at: string
}

export interface ContentDraft {
  id: string
  ideation_item_id: string | null
  platform: Platform
  content: string
  status: 'draft' | 'reviewed' | 'published'
  created_at: string
  updated_at: string
}
