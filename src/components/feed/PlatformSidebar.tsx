import { Platform } from '../../types'
import { C, F, R } from '../../lib/tokens'

const PLATFORMS: { label: string; value: Platform }[] = [
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Twitter/X', value: 'twitter' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Instagram', value: 'instagram' },
]

interface Props {
  selected: Platform[]
  onToggle: (p: Platform) => void
  onClear: () => void
}

export default function PlatformSidebar({ selected, onToggle, onClear }: Props) {
  return (
    <div
      style={{
        backgroundColor: C.bg.surface,
        border: `1px solid ${C.border.default}`,
        borderRadius: R.card,
        padding: '12px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <span style={{ fontFamily: F.mono, fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text.muted }}>
          Platform
        </span>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            style={{ fontFamily: F.mono, fontSize: '10px', color: C.text.muted, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Pills */}
      <div className="flex flex-col gap-2">
        {PLATFORMS.map((p) => {
          const active = selected.includes(p.value)
          return (
            <button
              key={p.value}
              onClick={() => onToggle(p.value)}
              style={{
                fontFamily: F.mono,
                fontSize: '12px',
                fontWeight: active ? 500 : 400,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: active ? C.accent.red : 'transparent',
                color: active ? '#FFFFFF' : C.text.secondary,
                border: `1px solid ${active ? C.accent.red : C.border.default}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = C.border.hover
                  e.currentTarget.style.color = C.text.primary
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = C.border.default
                  e.currentTarget.style.color = C.text.secondary
                }
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
