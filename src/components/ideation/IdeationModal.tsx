import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight, Copy, Check } from 'lucide-react'
import { IdeationItem } from '../../types'
import { useStore } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'
import { Platform } from '../../types'

interface IdeationModalProps {
  item: IdeationItem
  onClose: () => void
}

function toMarkdown(topic: string, outline: string): string {
  return `# ${topic}\n\n${outline}`
}

export default function IdeationModal({ item, onClose }: IdeationModalProps) {
  const setActiveIdeation = useStore((s) => s.setActiveIdeation)
  const updateIdeationItem = useStore((s) => s.updateIdeationItem)
  const navigate = useNavigate()

  const [topic, setTopic] = useState(item.topic)
  const [outline, setOutline] = useState(item.outline)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function scheduleAutosave(newTopic: string, newOutline: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      await updateIdeationItem(item.id, { topic: newTopic, outline: newOutline })
      setSaving(false)
    }, 800)
  }

  function handleTopicChange(val: string) {
    setTopic(val)
    scheduleAutosave(val, outline)
  }

  function handleOutlineChange(val: string) {
    setOutline(val)
    scheduleAutosave(topic, val)
  }

  function handleCopy() {
    navigator.clipboard.writeText(toMarkdown(topic, outline))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWrite() {
    setActiveIdeation({ ...item, topic, outline })
    navigate('/content-studio')
    onClose()
  }

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
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
          maxWidth: '760px',
          maxHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 28px',
            borderBottom: `1px solid ${C.border.default}`,
            flexShrink: 0,
          }}
        >
          {item.platform && <PlatformBadge platform={item.platform as Platform} size="sm" />}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {saving && (
              <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted, marginRight: '6px' }}>
                Saving…
              </span>
            )}
            <button
              onClick={handleCopy}
              title="Copy as Markdown"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copied ? C.accent.green : C.text.muted,
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.15s',
                fontFamily: F.mono,
                fontSize: '12px',
              }}
              onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = C.text.primary }}
              onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = C.text.muted }}
            >
              {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
              {copied ? 'Copied' : 'Copy MD'}
            </button>
            <button
              onClick={onClose}
              style={{
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
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '36px 44px 28px' }}>
          {/* Editable title */}
          <textarea
            value={topic}
            onChange={(e) => handleTopicChange(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              fontFamily: F.display,
              fontSize: '26px',
              fontWeight: 700,
              color: C.text.primary,
              lineHeight: 1.3,
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              marginBottom: '24px',
              padding: 0,
              overflowY: 'hidden',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />

          <div style={{ borderTop: `1px solid ${C.border.default}`, marginBottom: '24px' }} />

          {/* Editable outline */}
          <textarea
            value={outline}
            onChange={(e) => handleOutlineChange(e.target.value)}
            style={{
              width: '100%',
              fontFamily: F.body,
              fontSize: '15px',
              color: C.text.secondary,
              lineHeight: 1.8,
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: 0,
              minHeight: '260px',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${C.border.default}`,
            padding: '16px 44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
            {item.source_item_ids.length > 0
              ? `From ${item.source_item_ids.length} list ${item.source_item_ids.length === 1 ? 'item' : 'items'}`
              : 'Generated'}
          </span>
          <button
            onClick={handleWrite}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: F.mono,
              fontSize: '13px',
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
            Write This <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
