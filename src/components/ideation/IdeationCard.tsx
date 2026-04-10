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

  const previewText = item.outline.split('\n').filter(Boolean).slice(0, 2).join(' ')

  return (
    <>
      <article
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: C.bg.surface,
          border: `1px solid ${isHovered ? C.border.hover : C.border.default}`,
          borderRadius: R.card,
          padding: '24px',
          transition: 'border-color 0.15s ease',
          height: '220px',
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
          style={{
            fontFamily: F.display,
            fontSize: '18px',
            fontWeight: 600,
            color: C.text.primary,
            lineHeight: 1.4,
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.topic}
        </h3>

        {/* Outline preview */}
        <p
          style={{
            flex: 1,
            fontFamily: F.body,
            fontSize: '14px',
            color: C.text.secondary,
            lineHeight: 1.6,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            margin: 0,
          }}
        >
          {previewText}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: `1px solid ${C.border.subtle}`, flexShrink: 0, marginTop: '12px' }}
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
