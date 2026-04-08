import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import { Platform } from '../../types'
import PlatformBadge from '../ui/PlatformBadge'

export default function TrendingSidebar() {
  const trending = useStore(useShallow((s) => s.trending))

  return (
    <div
      style={{
        backgroundColor: C.bg.surface,
        border: `1px solid ${C.border.default}`,
        borderRadius: R.card,
        padding: '12px',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontFamily: F.mono, fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text.muted }}>
          What&apos;s Trending
        </span>
      </div>

      {trending.length === 0 ? (
        <p style={{ fontFamily: F.body, fontSize: '13px', color: C.text.muted }}>
          Nothing yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {trending.map((topic) => (
            <div key={topic.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span style={{ fontFamily: F.mono, fontSize: '10px', color: C.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {topic.category}
                </span>
                {topic.platform && (
                  <PlatformBadge platform={topic.platform as Platform} size="sm" />
                )}
              </div>
              <p style={{ fontFamily: F.body, fontSize: '13px', color: C.text.primary, lineHeight: 1.4 }}>
                {topic.topic}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
