import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { IdeationItem } from '../../types'
import { useStore } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'
import { Platform } from '../../types'

interface IdeationCardProps {
  item: IdeationItem
}

export default function IdeationCard({ item }: IdeationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const setActiveIdeation = useStore((s) => s.setActiveIdeation)
  const navigate = useNavigate()

  const outlineLines = item.outline.split('\n')

  function handleWrite() {
    setActiveIdeation(item)
    navigate('/content-studio')
  }

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: C.bg.surface,
        border: `1px solid ${isHovered ? C.border.hover : C.border.default}`,
        borderRadius: R.card,
        padding: '20px 24px',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Row 1: Platform badge */}
      {item.platform && (
        <div className="flex items-center gap-2 mb-3">
          <PlatformBadge platform={item.platform as Platform} size="sm" />
        </div>
      )}

      {/* Topic title */}
      <h3
        className="mb-3"
        style={{ fontFamily: F.display, fontSize: '16px', fontWeight: 600, color: C.text.primary, lineHeight: 1.4 }}
      >
        {item.topic}
      </h3>

      {/* Outline — expandable */}
      <div className="mb-4">
        <div
          style={{
            maxHeight: expanded ? '500px' : '5.4em',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}
        >
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {outlineLines.map((line, i) => (
              <li
                key={i}
                style={{
                  fontFamily: F.body,
                  fontSize: '13px',
                  color: C.text.secondary,
                  lineHeight: 1.6,
                  paddingLeft: '4px',
                  marginBottom: '2px',
                }}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
        {outlineLines.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              fontFamily: F.mono,
              fontSize: '11px',
              color: C.accent.red,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginTop: '4px',
            }}
          >
            {expanded ? 'Show less' : `+${outlineLines.length - 3} more`}
          </button>
        )}
      </div>

      {/* Footer: source count + Write button */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: `1px solid ${C.border.subtle}` }}
      >
        <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted }}>
          {item.source_item_ids.length > 0
            ? `From ${item.source_item_ids.length} list ${item.source_item_ids.length === 1 ? 'item' : 'items'}`
            : 'Generated'}
        </span>
        <button
          onClick={handleWrite}
          className="flex items-center gap-1.5"
          style={{
            fontFamily: F.mono,
            fontSize: '12px',
            color: C.accent.red,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            letterSpacing: '0.03em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Write This <ArrowRight size={13} strokeWidth={2} />
        </button>
      </div>
    </article>
  )
}
