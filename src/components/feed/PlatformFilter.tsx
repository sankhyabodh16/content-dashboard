import { Platform } from '../../types'
import { useStore } from '../../store/useStore'
import { C, F } from '../../lib/tokens'

const PLATFORMS: { label: string; value: Platform }[] = [
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Twitter/X', value: 'twitter' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Instagram', value: 'instagram' },
]

export default function PlatformFilter() {
  const activeFilter = useStore((s) => s.activeFilter)
  const toggleFilter = useStore((s) => s.toggleFilter)

  return (
    <div className="flex items-center gap-5 flex-wrap">
      {PLATFORMS.map((p) => {
        const checked = activeFilter.includes(p.value)
        return (
          <label
            key={p.value}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleFilter(p.value)}
              style={{
                width: '14px',
                height: '14px',
                accentColor: C.accent.red,
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                fontFamily: F.mono,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: checked ? C.text.primary : C.text.muted,
                fontWeight: checked ? 500 : 400,
              }}
            >
              {p.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}
