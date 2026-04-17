import { BookMarked, Clock, CheckCircle2, type LucideIcon } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import { FeedItem } from '../../types'
import FeedCard from '../feed/FeedCard'
import EmptyState from '../ui/EmptyState'

export default function LibraryPage() {
  const { feedItems } = useStore(
    useShallow((s) => ({ feedItems: s.feedItems }))
  )
  const bookmarked = feedItems.filter((item) => item.is_bookmarked)
  const complete = bookmarked.filter((i) => (i.tags ?? []).includes('ideation-complete'))
  const pending = bookmarked.filter((i) => !complete.includes(i))

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 py-6 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}>
            Library
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            {bookmarked.length} saved · {pending.length} yet to ideate · {complete.length} complete
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col items-center">
        {bookmarked.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="Your library is empty"
            subtitle="Save posts from the Feed to build your ideation source"
          />
        ) : (
          <div className="w-full flex flex-col gap-6" style={{ maxWidth: '680px' }}>
            {pending.length > 0 && (
              <GroupSection
                title="Yet To Ideate"
                items={pending}
                accent={C.accent.orange}
                icon={Clock}
              />
            )}
            {complete.length > 0 && (
              <GroupSection
                title="Ideation Complete"
                items={complete}
                accent={C.accent.green}
                icon={CheckCircle2}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GroupSection({
  title,
  items,
  accent,
  icon: Icon,
}: {
  title: string
  items: FeedItem[]
  accent: string
  icon: LucideIcon
}) {
  return (
    <div
      style={{
        borderRadius: R.card,
        overflow: 'hidden',
        border: `1px solid ${accent}30`,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 50%, transparent 100%)`,
          borderBottom: `1px solid ${accent}25`,
          padding: '18px 24px',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: R.sm,
                backgroundColor: `${accent}22`,
                border: `1px solid ${accent}40`,
                color: accent,
              }}
            >
              <Icon size={16} strokeWidth={2} />
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontSize: '18px',
                fontWeight: 700,
                color: accent,
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: '12px',
              color: C.text.muted,
            }}
          >
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 16px 0 16px', backgroundColor: C.bg.base }}>
        {items.map((item) => (
          <FeedCard key={item.platform_id} item={item} />
        ))}
      </div>
    </div>
  )
}
