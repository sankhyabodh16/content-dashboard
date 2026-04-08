import { useMemo, useState } from 'react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import { Platform } from '../../types'
import PlatformBadge from '../ui/PlatformBadge'

const DAY_MS = 86400000

export default function TrendingSidebar() {
  const trending = useStore(useShallow((s) => s.trending))
  const [tab, setTab] = useState<'today' | 'week'>('today')

  const { todayItems, weekItems } = useMemo(() => {
    const now = Date.now()
    const todayItems = trending.filter((t) => now - new Date(t.created_at).getTime() < DAY_MS)
    const weekItems = trending.filter(
      (t) => now - new Date(t.created_at).getTime() >= DAY_MS
    )
    return { todayItems, weekItems }
  }, [trending])

  const displayed = tab === 'today' ? todayItems : weekItems

  return (
    <div>
      <div
        style={{
          backgroundColor: C.bg.surface,
          border: `1px solid ${C.border.default}`,
          borderRadius: R.card,
          padding: '20px',
        }}
      >
        {/* Header + tabs */}
        <div className="flex items-center justify-between mb-4">
          <span
            style={{
              fontFamily: F.display,
              fontSize: '14px',
              fontWeight: 600,
              color: C.text.primary,
            }}
          >
            What&apos;s Trending
          </span>

          {/* Tab toggle */}
          <div
            className="flex items-center"
            style={{
              backgroundColor: C.bg.elevated,
              border: `1px solid ${C.border.default}`,
              borderRadius: R.sm,
              padding: '2px',
              gap: '2px',
            }}
          >
            {(['today', 'week'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontFamily: F.mono,
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: tab === t ? C.accent.red : 'transparent',
                  color: tab === t ? '#fff' : C.text.muted,
                }}
              >
                {t === 'today' ? 'Today' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        {displayed.length === 0 ? (
          <p style={{ fontFamily: F.body, fontSize: '13px', color: C.text.muted }}>
            Nothing yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map((topic) => (
              <div key={topic.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: '10px',
                      color: C.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {topic.category}
                  </span>
                  {topic.platform && (
                    <PlatformBadge platform={topic.platform as Platform} size="sm" />
                  )}
                </div>
                <p
                  style={{
                    fontFamily: F.body,
                    fontSize: '13px',
                    color: C.text.primary,
                    lineHeight: 1.4,
                    cursor: 'default',
                  }}
                >
                  {topic.topic}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
