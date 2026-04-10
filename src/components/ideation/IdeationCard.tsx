import { useState } from 'react'
import { IdeationItem } from '../../types'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'
import { Platform } from '../../types'
import IdeationModal from './IdeationModal'

interface IdeationCardProps {
  item: IdeationItem
}

export default function IdeationCard({ item }: IdeationCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const previewLines = item.outline.split('\n').filter(Boolean).slice(0, 3)

  return (
    <>
      <article
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: C.bg.surface,
          border: `1px solid ${isHovered ? C.border.hover : C.border.default}`,
          borderRadius: R.card,
          padding: '20px 24px',
          transition: 'border-color 0.15s ease',
          height: '200px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Platform badge */}
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

        {/* Outline preview — clipped to available space */}
        <div style={{ flex: 1, overflow: 'hidden', marginBottom: '12px' }}>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {previewLines.map((line, i) => (
              <li
                key={i}
                style={{
                  fontFamily: F.body,
                  fontSize: '13px',
                  color: C.text.secondary,
                  lineHeight: 1.6,
                  paddingLeft: '4px',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: `1px solid ${C.border.subtle}`, flexShrink: 0 }}
        >
          <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted }}>
            {item.source_item_ids.length > 0
              ? `From ${item.source_item_ids.length} list ${item.source_item_ids.length === 1 ? 'item' : 'items'}`
              : 'Generated'}
          </span>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              fontFamily: F.mono,
              fontSize: '11px',
              color: C.text.secondary,
              background: 'none',
              border: `1px solid ${C.border.default}`,
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '4px 10px',
              letterSpacing: '0.03em',
              transition: 'border-color 0.15s, color 0.15s',
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
            Open
          </button>
        </div>
      </article>

      {modalOpen && <IdeationModal item={item} onClose={() => setModalOpen(false)} />}
    </>
  )
}
