import { Platform } from '../../types'
import { useStore, useShallow } from '../../store/useStore'
import { C, F } from '../../lib/tokens'

const FILTERS: { label: string; value: Platform | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Twitter/X', value: 'twitter' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Instagram', value: 'instagram' },
]

export default function PlatformFilter() {
  const { activeFilter, toggleFilter } = useStore(
    useShallow((s) => ({ activeFilter: s.activeFilter, toggleFilter: s.toggleFilter }))
  )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTERS.map((filter) => {
        const isActive =
          filter.value === 'all'
            ? activeFilter.length === 0
            : activeFilter.includes(filter.value as Platform)
        return (
          <button
            key={filter.value}
            onClick={() => toggleFilter(filter.value)}
            style={{
              fontFamily: F.mono,
              fontSize: '12px',
              fontWeight: isActive ? 500 : 400,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: isActive ? C.accent.red : 'transparent',
              color: isActive ? '#FFFFFF' : C.text.secondary,
              border: `1px solid ${isActive ? C.accent.red : C.border.default}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = C.border.hover
                e.currentTarget.style.color = C.text.primary
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = C.border.default
                e.currentTarget.style.color = C.text.secondary
              }
            }}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
