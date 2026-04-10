import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight, Copy, Check } from 'lucide-react'
import { IdeationItem } from '../../types'
import { useStore } from '../../store/useStore'
import { C, F } from '../../lib/tokens'
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

  // Auto-save 800ms after the user stops typing
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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 50,
        }}
      />

      {/* Sidebar drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          backgroundColor: C.bg.surface,
          borderLeft: `1px solid ${C.border.default}`,
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 20px',
            borderBottom: `1px solid ${C.border.default}`,
            flexShrink: 0,
          }}
        >
          {item.platform && <PlatformBadge platform={item.platform as Platform} size="sm" />}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Save status */}
            {saving && (
              <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted, marginRight: '4px' }}>
                Saving…
              </span>
            )}

            {/* Copy markdown */}
            <button
              onClick={handleCopy}
              title="Copy as Markdown"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copied ? C.accent.green : C.text.muted,
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'color 0.15s',
                fontFamily: F.mono,
                fontSize: '11px',
              }}
              onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = C.text.primary }}
              onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = C.text.muted }}
            >
              {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
              {copied ? 'Copied' : 'Copy MD'}
            </button>

            {/* Close */}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* Editable title */}
          <textarea
            value={topic}
            onChange={(e) => handleTopicChange(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              fontFamily: F.display,
              fontSize: '20px',
              fontWeight: 700,
              color: C.text.primary,
              lineHeight: 1.35,
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              marginBottom: '20px',
              padding: 0,
              overflowY: 'hidden',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${C.border.default}`, marginBottom: '20px' }} />

          {/* Editable outline */}
          <textarea
            value={outline}
            onChange={(e) => handleOutlineChange(e.target.value)}
            style={{
              width: '100%',
              fontFamily: F.body,
              fontSize: '13px',
              color: C.text.secondary,
              lineHeight: 1.75,
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: 0,
              minHeight: '300px',
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
            padding: '14px 28px',
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
    </>,
    document.body
  )
}
