import { Bookmark } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F } from '../../lib/tokens'
import FeedCard from '../feed/FeedCard'
import EmptyState from '../ui/EmptyState'

export default function BookmarksPage() {
  const feedItems = useStore(useShallow((s) => s.feedItems))
  const bookmarked = feedItems.filter((item) => item.is_bookmarked)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 py-6 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}>
            Bookmarks
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            {bookmarked.length} saved {bookmarked.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Content — centered like feed */}
      <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col items-center">
        {bookmarked.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No bookmarks yet"
            subtitle="Save content from the Feed to see it here"
          />
        ) : (
          <div className="w-full" style={{ maxWidth: '680px' }}>
            {bookmarked.map((item) => (
              <FeedCard key={item.platform_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
