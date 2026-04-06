import { List } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import FeedCard from '../feed/FeedCard'
import EmptyState from '../ui/EmptyState'

export default function ListPage() {
  const { feedItems, ideationItems } = useStore(
    useShallow((s) => ({ feedItems: s.feedItems, ideationItems: s.ideationItems }))
  )
  const listed = feedItems.filter((item) => item.is_bookmarked)

  const analyzedIds = new Set(ideationItems.flatMap((i) => i.source_item_ids))

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 py-6 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}>
            List
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            {listed.length} saved {listed.length === 1 ? 'item' : 'items'} · Claude will use these to generate ideas
          </p>
        </div>
      </div>

      {/* Content — centered like feed */}
      <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col items-center">
        {listed.length === 0 ? (
          <EmptyState
            icon={List}
            title="Your list is empty"
            subtitle="Add content from the Feed to build your ideation source"
          />
        ) : (
          <div className="w-full" style={{ maxWidth: '680px' }}>
            {listed.map((item) => {
              const isAnalyzed = analyzedIds.has(item.platform_id)
              return (
                <div key={item.platform_id} style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '60px',
                      zIndex: 10,
                      fontFamily: F.mono,
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      backgroundColor: isAnalyzed ? 'rgba(0,230,157,0.10)' : 'rgba(102,102,102,0.12)',
                      color: isAnalyzed ? '#00E69D' : '#666666',
                      padding: '2px 8px',
                      borderRadius: R.sm,
                      pointerEvents: 'none',
                    }}
                  >
                    {isAnalyzed ? 'ANALYZED' : 'PENDING'}
                  </span>
                  <FeedCard item={item} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
