import { useState } from 'react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import FeedCard from './FeedCard'
import FeedCardSkeleton from './FeedCardSkeleton'
import PlatformFilter from './PlatformFilter'
import TrendingSidebar from './TrendingSidebar'

export default function FeedPage() {
  const { feedItems, clearFeed, isLoading } = useStore(
    useShallow((s) => ({ feedItems: s.feedItems, clearFeed: s.clearFeed, isLoading: s.isLoading }))
  )
  const activeFilter = useStore((s) => s.activeFilter)
  const [confirmClear, setConfirmClear] = useState(false)

  function handleClearFeed() {
    if (confirmClear) {
      clearFeed()
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  const visibleItems = feedItems.filter((item) => {
    if (item.is_hidden) return false
    if (activeFilter.length > 0 && !activeFilter.includes(item.platform)) return false
    return true
  })

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 py-6 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}>
            Feed
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            Stay ahead of what matters in your space
          </p>
        </div>

        {/* Clear Feed */}
        <button
          onClick={handleClearFeed}
          style={{
            backgroundColor: confirmClear ? C.accent.red : 'transparent',
            border: `1px solid ${confirmClear ? C.accent.red : C.border.default}`,
            borderRadius: R.input,
            padding: '8px 14px',
            color: confirmClear ? '#fff' : C.text.muted,
            fontFamily: F.mono,
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!confirmClear) {
              e.currentTarget.style.borderColor = C.border.hover
              e.currentTarget.style.color = C.text.secondary
            }
          }}
          onMouseLeave={(e) => {
            if (!confirmClear) {
              e.currentTarget.style.borderColor = C.border.default
              e.currentTarget.style.color = C.text.muted
            }
          }}
        >
          {confirmClear ? 'CONFIRM CLEAR?' : 'CLEAR FEED'}
        </button>
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main feed column — centered */}
        <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col items-center">
          {/* Platform Filter */}
          <div className="mb-6 w-full" style={{ maxWidth: '680px' }}>
            <PlatformFilter />
          </div>

          {/* Feed items */}
          <div className="w-full" style={{ maxWidth: '680px' }}>
            {isLoading ? (
              <>
                <FeedCardSkeleton />
                <FeedCardSkeleton />
                <FeedCardSkeleton />
              </>
            ) : visibleItems.length === 0 ? (
              <div className="py-16 text-center">
                <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted }}>
                  No posts match your current filter.
                </p>
              </div>
            ) : (
              visibleItems.map((item) => <FeedCard key={item.platform_id} item={item} />)
            )}
          </div>
        </div>

        {/* Right sidebar — sticky */}
        <div
          className="sidebar-scroll flex-shrink-0 py-6"
          style={{
            width: '340px',
            paddingLeft: '20px',
            paddingRight: '24px',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 0,
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          <TrendingSidebar />
        </div>
      </div>
    </div>
  )
}
