import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight } from 'lucide-react'
import { IdeationItem } from '../../types'
import { useStore } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'
import { Platform } from '../../types'

interface IdeationModalProps {
  item: IdeationItem
  onClose: () => void
}

export default function IdeationModal({ item, onClose }: IdeationModalProps) {
  const setActiveIdeation = useStore((s) => s.setActiveIdeation)
  const navigate = useNavigate()

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleWrite() {
    setActiveIdeation(item)
    navigate('/content-studio')
    onClose()
  }

  // Split outline into paragraphs on blank lines
  const paragraphs = item.outline.split(/\n{2,}/)

  return createPortal(
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '60px',
        paddingBottom: '60px',
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: C.bg.surface,
          border: `1px solid ${C.border.default}`,
          borderRadius: R.modal,
          width: '100%',
          maxWidth: '680px',
          maxHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid ${C.border.subtle}`,
            flexShrink: 0,
          }}
        >
          {item.platform && <PlatformBadge platform={item.platform as Platform} size="sm" />}
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.text.muted,
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 40px',
          }}
        >
          {/* Title */}
          <h2
            style={{
              fontFamily: F.display,
              fontSize: '22px',
              fontWeight: 700,
              color: C.text.primary,
              lineHeight: 1.35,
              marginBottom: '28px',
            }}
          >
            {item.topic}
          </h2>

          {/* Outline paragraphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paragraphs.map((para, i) => {
              const isKeyPoints = para.startsWith('Key Points:')
              if (isKeyPoints) {
                const lines = para.split('\n').filter(Boolean)
                return (
                  <div
                    key={i}
                    style={{
                      borderTop: `1px solid ${C.border.default}`,
                      paddingTop: '20px',
                      marginTop: '4px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: F.mono,
                        fontSize: '11px',
                        color: C.text.muted,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '12px',
                      }}
                    >
                      Key Points
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {lines.slice(1).map((line, j) => (
                        <li
                          key={j}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            fontFamily: F.body,
                            fontSize: '14px',
                            color: C.text.secondary,
                            lineHeight: 1.6,
                          }}
                        >
                          <span style={{ color: C.accent.red, flexShrink: 0, marginTop: '2px' }}>•</span>
                          <span>{line.replace(/^[•\-]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              }
              return (
                <p
                  key={i}
                  style={{
                    fontFamily: F.body,
                    fontSize: '14px',
                    color: C.text.secondary,
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {para}
                </p>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${C.border.default}`,
            padding: '16px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
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
      </div>
    </div>,
    document.body
  )
}
