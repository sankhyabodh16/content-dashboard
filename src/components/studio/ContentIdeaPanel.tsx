import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Sparkles, Trash2, Link2, Pencil, Check, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ContentIdea } from '../../types'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'

const MIN_WIDTH = 560
const MAX_WIDTH = Math.round(MIN_WIDTH * 1.4)

interface Props {
  idea: ContentIdea
  onClose: () => void
}

export default function ContentIdeaPanel({ idea, onClose }: Props) {
  const { updateIdea, deleteIdea, feedItems } = useStore(
    useShallow((s) => ({
      updateIdea: s.updateIdea,
      deleteIdea: s.deleteIdea,
      feedItems: s.feedItems,
    }))
  )

  const [title, setTitle] = useState(idea.title)
  const [outline, setOutline] = useState(idea.outline)
  const [editingOutline, setEditingOutline] = useState(false)
  const [panelWidth, setPanelWidth] = useState(MIN_WIDTH)

  const outlineRef = useRef<HTMLTextAreaElement>(null)
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(MIN_WIDTH)

  useEffect(() => {
    setTitle(idea.title)
    setOutline(idea.outline)
    setEditingOutline(false)
  }, [idea.id])

  useEffect(() => {
    if (editingOutline && outlineRef.current) {
      const el = outlineRef.current
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
      el.focus()
    }
  }, [editingOutline])

  useEffect(() => {
    if (!editingOutline || !outlineRef.current) return
    const el = outlineRef.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [outline, editingOutline])

  // Drag-to-resize
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = panelWidth
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [panelWidth])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return
      const delta = dragStartX.current - e.clientX
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta))
      setPanelWidth(next)
    }
    function onUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const source = idea.source_platform_id
    ? feedItems.find((f) => f.platform_id === idea.source_platform_id) ?? null
    : null

  function saveTitle() {
    if (title !== idea.title) updateIdea(idea.id, { title })
  }

  function saveOutline() {
    if (outline !== idea.outline) updateIdea(idea.id, { outline })
    setEditingOutline(false)
  }

  function handleDelete() {
    if (confirm('Delete this idea?')) {
      deleteIdea(idea.id)
      onClose()
    }
  }

  function handleEnrich() {
    alert('Perplexity enrichment not yet wired up')
  }

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen relative"
      style={{
        width: `${panelWidth}px`,
        backgroundColor: C.bg.sidebar,
        borderLeft: `1px solid ${C.border.default}`,
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '5px',
          cursor: 'ew-resize',
          zIndex: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${C.accent.red}30`)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      />

      {/* Panel header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div className="flex items-center gap-2" style={{ color: C.text.muted }}>
          <Sparkles size={14} strokeWidth={2} />
          <span
            style={{
              fontFamily: F.mono,
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Content Idea
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: R.sm, background: 'transparent', border: 'none', color: C.text.muted, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.accent.red)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
            title="Delete idea"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: R.sm, background: 'transparent', border: 'none', color: C.text.muted, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
            title="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '28px 32px' }}>
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          placeholder="Untitled idea"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontFamily: F.display,
            fontSize: '28px',
            fontWeight: 700,
            color: C.text.primary,
            lineHeight: 1.2,
            marginBottom: '24px',
          }}
        />

        {/* Outline label + edit toggle */}
        <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: '11px',
              color: C.text.muted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Outline
          </span>
          <button
            onClick={() => editingOutline ? saveOutline() : setEditingOutline(true)}
            className="flex items-center gap-1"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: C.text.muted,
              fontFamily: F.body,
              fontSize: '12px',
              padding: '2px 6px',
              borderRadius: R.sm,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
          >
            {editingOutline
              ? <><Check size={12} strokeWidth={2} /> Save</>
              : <><Pencil size={12} strokeWidth={2} /> Edit</>
            }
          </button>
        </div>

        {/* Outline — rendered or textarea */}
        {editingOutline ? (
          <textarea
            ref={outlineRef}
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            onBlur={saveOutline}
            placeholder="Draft the hook, key points, CTA…"
            style={{
              width: '100%',
              minHeight: '360px',
              background: C.bg.surface,
              border: `1px solid ${C.border.hover}`,
              borderRadius: R.input,
              padding: '16px 18px',
              outline: 'none',
              fontFamily: F.mono,
              fontSize: '13px',
              color: C.text.primary,
              lineHeight: 1.7,
              resize: 'none',
              overflow: 'hidden',
            }}
          />
        ) : (
          <div
            onClick={() => setEditingOutline(true)}
            style={{
              width: '100%',
              minHeight: '120px',
              background: C.bg.surface,
              border: `1px solid ${C.border.default}`,
              borderRadius: R.input,
              padding: '16px 18px',
              cursor: 'text',
              fontFamily: F.body,
              fontSize: '14px',
              color: C.text.primary,
              lineHeight: 1.75,
            }}
          >
            {outline ? (
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 style={{ fontFamily: F.display, fontSize: '20px', fontWeight: 700, color: C.text.primary, margin: '0 0 12px' }}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 style={{ fontFamily: F.display, fontSize: '16px', fontWeight: 600, color: C.text.primary, margin: '20px 0 8px' }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 style={{ fontFamily: F.body, fontSize: '14px', fontWeight: 600, color: C.text.primary, margin: '16px 0 6px' }}>{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p style={{ margin: '0 0 10px', color: C.text.primary }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 600, color: C.text.primary }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ color: C.text.secondary }}>{children}</em>
                  ),
                  hr: () => (
                    <hr style={{ border: 'none', borderTop: `1px solid ${C.border.default}`, margin: '16px 0' }} />
                  ),
                  ul: ({ children }) => (
                    <ul style={{ margin: '0 0 10px', paddingLeft: '20px' }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ margin: '0 0 10px', paddingLeft: '20px' }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ margin: '4px 0', color: C.text.primary }}>{children}</li>
                  ),
                  code: ({ children }) => (
                    <code style={{ fontFamily: F.mono, fontSize: '12px', backgroundColor: C.bg.elevated, padding: '1px 5px', borderRadius: '3px', color: C.accent.green }}>{children}</code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote style={{ borderLeft: `3px solid ${C.accent.red}`, paddingLeft: '12px', margin: '10px 0', color: C.text.secondary }}>{children}</blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.accent.red, textDecoration: 'none' }}>{children}</a>
                  ),
                }}
              >
                {outline}
              </ReactMarkdown>
            ) : (
              <span style={{ color: C.text.muted, fontStyle: 'italic' }}>
                Click to add outline…
              </span>
            )}
          </div>
        )}

        {/* Enrich button */}
        <button
          onClick={handleEnrich}
          className="flex items-center gap-2"
          style={{
            marginTop: '14px',
            padding: '10px 16px',
            borderRadius: R.input,
            background: 'linear-gradient(135deg, rgba(0,230,157,0.12) 0%, rgba(0,230,157,0.04) 100%)',
            border: `1px solid ${C.accent.green}50`,
            color: C.accent.green,
            fontFamily: F.body,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent.green)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${C.accent.green}50`)}
        >
          <Sparkles size={14} strokeWidth={2} />
          Enrich With Perplexity
        </button>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: C.border.default, margin: '32px 0 20px' }} />

        {/* Source section */}
        <div
          style={{
            fontFamily: F.mono,
            fontSize: '11px',
            color: C.text.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          Source
        </div>

        {source ? (
          <a
            href={source.post_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
            style={{
              padding: '10px 14px',
              borderRadius: R.input,
              backgroundColor: C.bg.surface,
              border: `1px solid ${C.border.default}`,
              textDecoration: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.border.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border.default)}
          >
            <PlatformBadge platform={source.platform} size="sm" />
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontFamily: F.body,
                  fontSize: '13px',
                  fontWeight: 500,
                  color: C.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {source.author || source.handle || 'Unknown'}
              </div>
              <div
                style={{
                  fontFamily: F.body,
                  fontSize: '12px',
                  color: C.text.muted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '2px',
                }}
              >
                {(source.title || source.body || '').replace(/\s+/g, ' ').trim().slice(0, 80)}
                {(source.title || source.body || '').length > 80 ? '…' : ''}
              </div>
            </div>
            <ExternalLink size={13} strokeWidth={2} style={{ color: C.text.muted, flexShrink: 0 }} />
          </a>
        ) : (
          <div
            className="flex items-center gap-3"
            style={{
              padding: '10px 14px',
              borderRadius: R.input,
              backgroundColor: C.bg.surface,
              border: `1px dashed ${C.border.default}`,
              color: C.text.muted,
              fontFamily: F.body,
              fontSize: '13px',
            }}
          >
            <Link2 size={14} strokeWidth={2} />
            No source linked
          </div>
        )}
      </div>
    </aside>
  )
}
