import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { IdeationItem } from '../../types'
import { useStore } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'
import { Platform } from '../../types'
import IdeationModal from './IdeationModal'

interface IdeationCardProps {
  item: IdeationItem
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}

export default function IdeationCard({ item, selected, onSelect }: IdeationCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const deleteIdeationItem = useStore((s) => s.deleteIdeationItem)

  const previewText = item.outline.split('\n').filter(Boolean).slice(0, 2).join(' ')

  return (
    <>
      <article
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setModalOpen(true)}
        style={{
          cursor: 'pointer',
          backgroundColor: selected ? C.bg.elevated : C.bg.surface,
          border: `1px solid ${selected ? C.border.hover : isHovered ? C.border.hover : C.border.default}`,
          borderRadius: R.card,
          padding: '24px',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
          height: '220px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Checkbox — top-left, visible on hover or when selected */}
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(item.id, !selected) }}
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            width: '15px',
            height: '15px',
            borderRadius: '3px',
            border: `1.5px solid ${selected ? C.text.muted : C.text.muted}`,
            backgroundColor: selected ? C.text.muted : 'transparent',
            cursor: 'pointer',
            opacity: selected || isHovered ? 1 : 0,
            transition: 'opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {selected && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke={C.bg.surface} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Platform badge — shifted right when checkbox visible */}
        <div
          className="flex items-center gap-2 mb-3"
          style={{ paddingLeft: selected || isHovered ? '24px' : '0', transition: 'padding-left 0.15s' }}
        >
          {item.platform && <PlatformBadge platform={item.platform as Platform} size="sm" />}
        </div>

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Delete */}
            <button
              onClick={(e) => { e.stopPropagation(); deleteIdeationItem(item.id) }}
              title="Delete"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.text.muted,
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.accent.red)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>

          </div>
        </div>
      </article>

      {modalOpen && <IdeationModal item={item} onClose={() => setModalOpen(false)} />}
    </>
  )
}
