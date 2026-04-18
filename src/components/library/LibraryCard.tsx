import { useState } from 'react'
import { FeedItem } from '../../types'
import { C, F, R } from '../../lib/tokens'
import { timeAgo } from '../../lib/utils'
import PlatformBadge from '../ui/PlatformBadge'

interface Props {
  item: FeedItem
  onClick: () => void
}

export default function LibraryCard({ item, onClick }: Props) {
  const [hover, setHover] = useState(false)
  const displayAuthor = item.subreddit ? item.subreddit : item.author
  const snippet = (item.title || item.body || '').replace(/\s+/g, ' ').trim()

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        backgroundColor: C.bg.surface,
        border: `1px solid ${hover ? C.border.hover : C.border.default}`,
        borderRadius: R.card,
        padding: '14px 16px',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        transform: hover ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Row 1: platform + author + time */}
      <div className="flex items-center gap-2 mb-2">
        <PlatformBadge platform={item.platform} />
        <span style={{ color: C.border.default, fontSize: '12px' }}>·</span>
        <span
          style={{
            fontFamily: F.body,
            fontSize: '12px',
            color: C.text.secondary,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {displayAuthor}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted, flexShrink: 0 }}>
          {timeAgo(item.created_at || item.scraped_at)}
        </span>
      </div>

      {/* Snippet */}
      {snippet && (
        <div
          style={{
            fontFamily: F.body,
            fontSize: '14px',
            color: C.text.primary,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {snippet}
        </div>
      )}
    </button>
  )
}
