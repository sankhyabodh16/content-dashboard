import { Creator } from '../../types'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'
import { timeAgo } from '../../lib/utils'
import { RefreshCw } from 'lucide-react'

interface CreatorCardProps {
  creator: Creator
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div
      style={{
        backgroundColor: C.bg.surface,
        border: `1px solid ${C.border.default}`,
        borderRadius: R.card,
        padding: '20px',
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.border.hover)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.border.default)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: `${creator.avatar_color}22`,
            color: creator.avatar_color,
            fontSize: '18px',
            fontFamily: F.display,
            fontWeight: 600,
          }}
        >
          {creator.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            style={{
              fontFamily: F.display,
              fontSize: '16px',
              fontWeight: 600,
              color: C.text.primary,
              lineHeight: 1.3,
              marginBottom: '4px',
            }}
          >
            {creator.name}
          </h3>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
              {creator.handle}
            </span>
            <PlatformBadge platform={creator.platform} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-3 gap-3 mb-4 py-3"
        style={{ borderTop: `1px solid ${C.border.subtle}`, borderBottom: `1px solid ${C.border.subtle}` }}
      >
        <Stat label="Followers" value={creator.followers} />
        <Stat label="Posts" value={creator.posts_scraped.toString()} />
        <Stat label="Last Scraped" value={creator.last_scraped ? timeAgo(creator.last_scraped) : 'Never'} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          style={{
            fontFamily: F.body,
            fontSize: '13px',
            fontWeight: 500,
            color: C.accent.red,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          View Profile →
        </button>
        <div className="flex-1" />
        <button
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
        >
          <RefreshCw size={11} strokeWidth={2} />
          Scrape Now
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        style={{ fontFamily: F.mono, fontSize: '10px', color: C.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        {label}
      </span>
      <span style={{ fontFamily: F.mono, fontSize: '13px', color: C.text.primary, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}
