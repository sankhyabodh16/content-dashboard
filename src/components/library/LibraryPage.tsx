import { useState } from 'react'
import { BookMarked, Clock, CheckCircle2, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import { FeedItem } from '../../types'
import EmptyState from '../ui/EmptyState'
import LibraryCard from './LibraryCard'
import FeedItemModal from './FeedItemModal'

type ColumnKey = 'pending' | 'complete'

export default function LibraryPage() {
  const { feedItems } = useStore(
    useShallow((s) => ({ feedItems: s.feedItems }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<ColumnKey, boolean>>({
    pending: false,
    complete: false,
  })

  const bookmarked = feedItems.filter((item) => item.is_bookmarked)
  const complete = bookmarked.filter((i) => (i.tags ?? []).includes('ideation-complete'))
  const pending = bookmarked.filter((i) => !complete.includes(i))

  const activeItem = activeId ? feedItems.find((i) => i.platform_id === activeId) ?? null : null

  function toggle(key: ColumnKey) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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
      {bookmarked.length === 0 ? (
        <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col items-center">
          <EmptyState
            icon={BookMarked}
            title="Your library is empty"
            subtitle="Save posts from the Feed to build your ideation source"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden px-10 py-6 flex" style={{ gap: '20px' }}>
          <KanbanColumn
            title="Yet To Ideate"
            items={pending}
            accent={C.accent.orange}
            icon={Clock}
            onOpen={setActiveId}
            collapsed={collapsed.pending}
            onToggle={() => toggle('pending')}
            collapseSide="left"
          />
          <KanbanColumn
            title="Ideation Complete"
            items={complete}
            accent={C.accent.green}
            icon={CheckCircle2}
            onOpen={setActiveId}
            collapsed={collapsed.complete}
            onToggle={() => toggle('complete')}
            collapseSide="right"
          />
        </div>
      )}

      {activeItem && (
        <FeedItemModal item={activeItem} onClose={() => setActiveId(null)} />
      )}
    </div>
  )
}

function KanbanColumn({
  title,
  items,
  accent,
  icon: Icon,
  onOpen,
  collapsed,
  onToggle,
  collapseSide,
}: {
  title: string
  items: FeedItem[]
  accent: string
  icon: LucideIcon
  onOpen: (id: string) => void
  collapsed: boolean
  onToggle: () => void
  collapseSide: 'left' | 'right'
}) {
  if (collapsed) {
    // Expand arrow points toward where the content would appear
    const ExpandIcon = collapseSide === 'left' ? ChevronRight : ChevronLeft
    return (
      <button
        onClick={onToggle}
        className="flex flex-col items-center flex-shrink-0"
        style={{
          width: '56px',
          borderRadius: R.card,
          border: `1px solid ${accent}30`,
          backgroundColor: C.bg.sidebar,
          cursor: 'pointer',
          padding: '14px 0',
          gap: '14px',
          transition: 'border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${accent}60`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${accent}30`
        }}
        title={`Expand ${title}`}
      >
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
            fontFamily: F.mono,
            fontSize: '11px',
            color: C.text.muted,
            backgroundColor: `${accent}15`,
            border: `1px solid ${accent}30`,
            padding: '2px 8px',
            borderRadius: R.pill,
          }}
        >
          {items.length}
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: '13px',
            fontWeight: 700,
            color: accent,
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            letterSpacing: '0.05em',
            marginTop: '4px',
          }}
        >
          {title}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: C.text.muted }}>
          <ExpandIcon size={14} strokeWidth={2} />
        </div>
      </button>
    )
  }

  const CollapseIcon = collapseSide === 'left' ? ChevronLeft : ChevronRight

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: R.card,
        border: `1px solid ${accent}30`,
        backgroundColor: C.bg.sidebar,
      }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 50%, transparent 100%)`,
          borderBottom: `1px solid ${accent}25`,
          padding: '16px 20px',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
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
                fontSize: '16px',
                fontWeight: 700,
                color: accent,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              style={{
                fontFamily: F.mono,
                fontSize: '12px',
                color: C.text.muted,
                backgroundColor: `${accent}15`,
                border: `1px solid ${accent}30`,
                padding: '2px 8px',
                borderRadius: R.pill,
              }}
            >
              {items.length}
            </div>
            <button
              onClick={onToggle}
              className="flex items-center justify-center"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: R.sm,
                background: 'transparent',
                border: `1px solid ${C.border.default}`,
                color: C.text.muted,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.text.primary
                e.currentTarget.style.borderColor = C.border.hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.text.muted
                e.currentTarget.style.borderColor = C.border.default
              }}
              title={`Collapse ${title}`}
            >
              <CollapseIcon size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Body — scrollable card list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px' }}>
        {items.length === 0 ? (
          <div
            className="flex items-center justify-center py-12 text-center"
            style={{
              fontFamily: F.body,
              fontSize: '13px',
              color: C.text.muted,
            }}
          >
            Nothing here yet
          </div>
        ) : (
          items.map((item) => (
            <LibraryCard
              key={item.platform_id}
              item={item}
              onClick={() => onOpen(item.platform_id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
