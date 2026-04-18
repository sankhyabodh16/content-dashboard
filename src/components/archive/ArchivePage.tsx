import { useState } from 'react'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { timeAgo } from '../../lib/utils'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'
import EmptyState from '../ui/EmptyState'

export default function ArchivePage() {
  const { feedItems, restorePost, clearArchive } = useStore(
    useShallow((s) => ({ feedItems: s.feedItems, restorePost: s.restorePost, clearArchive: s.clearArchive }))
  )
  const [confirming, setConfirming] = useState(false)

  const archivedItems = feedItems.filter((item) => item.is_hidden)

  function handleClearArchive() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setConfirming(false)
    clearArchive()
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 py-6 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div>
          <h1
            style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}
          >
            Archive
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            {archivedItems.length} archived {archivedItems.length === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {archivedItems.length > 0 && (
          <button
            onClick={handleClearArchive}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5"
            style={{
              backgroundColor: confirming ? C.accent.red : C.bg.elevated,
              border: `1px solid ${confirming ? C.accent.red : C.border.default}`,
              color: confirming ? '#fff' : C.text.secondary,
              fontFamily: F.mono,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '0.03em',
            }}
            onMouseEnter={(e) => {
              if (!confirming) e.currentTarget.style.borderColor = C.border.hover
            }}
            onMouseLeave={(e) => {
              if (!confirming) e.currentTarget.style.borderColor = C.border.default
            }}
          >
            <Trash2 size={13} strokeWidth={2} />
            {confirming ? 'Confirm delete?' : 'Clear Archive'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        {archivedItems.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="Archive is empty"
            subtitle="Posts you dismiss or clear from the feed will appear here"
          />
        ) : (
          <div style={{ maxWidth: '800px' }}>
            {/* List header */}
            <div
              className="flex items-center gap-4 px-4 pb-2 mb-1"
              style={{
                fontFamily: F.mono,
                fontSize: '10px',
                color: C.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                borderBottom: `1px solid ${C.border.subtle}`,
              }}
            >
              <span style={{ width: '100px' }}>Platform</span>
              <span className="flex-1">Title</span>
              <span style={{ width: '90px' }}>Author</span>
              <span style={{ width: '70px', textAlign: 'right' }}>Archived</span>
              <span style={{ width: '80px' }} />
            </div>

            {archivedItems.map((item) => (
              <div
                key={item.platform_id}
                className="flex items-center gap-4 px-4 py-3 rounded-lg"
                style={{
                  borderBottom: `1px solid ${C.border.default}`,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.bg.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Platform */}
                <div style={{ width: '100px', flexShrink: 0 }}>
                  <PlatformBadge platform={item.platform} size="sm" />
                </div>

                {/* Title */}
                <p
                  className="flex-1"
                  style={{
                    fontFamily: F.body,
                    fontSize: '14px',
                    color: C.text.primary,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </p>

                {/* Author */}
                <span
                  style={{
                    width: '90px',
                    flexShrink: 0,
                    fontFamily: F.body,
                    fontSize: '13px',
                    color: C.text.muted,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.subreddit ?? item.author}
                </span>

                {/* Time */}
                <span
                  style={{
                    width: '70px',
                    flexShrink: 0,
                    fontFamily: F.mono,
                    fontSize: '11px',
                    color: C.text.muted,
                    textAlign: 'right',
                  }}
                >
                  {timeAgo(item.scraped_at)}
                </span>

                {/* Restore */}
                <div style={{ width: '80px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => restorePost(item.platform_id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                    style={{
                      backgroundColor: C.bg.elevated,
                      border: `1px solid ${C.border.default}`,
                      color: C.text.secondary,
                      fontFamily: F.mono,
                      fontSize: '11px',
                      cursor: 'pointer',
                      letterSpacing: '0.03em',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.border.hover
                      e.currentTarget.style.color = C.text.primary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border.default
                      e.currentTarget.style.color = C.text.secondary
                    }}
                    title="Restore to feed"
                  >
                    <RotateCcw size={11} strokeWidth={2} />
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
