import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Sparkles, Trash2, Link2, ExternalLink } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'

export default function ContentIdeaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { contentIdeas, updateIdea, deleteIdea, feedItems } = useStore(
    useShallow((s) => ({
      contentIdeas: s.contentIdeas,
      updateIdea: s.updateIdea,
      deleteIdea: s.deleteIdea,
      feedItems: s.feedItems,
    }))
  )

  const idea = contentIdeas.find((i) => i.id === id) ?? null

  const [title, setTitle] = useState(idea?.title ?? '')
  const [outline, setOutline] = useState(idea?.outline ?? '')
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const outlineRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(idea?.title ?? '')
    setOutline(idea?.outline ?? '')
  }, [idea?.id])

  // Autosize title
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [title])

  // Autosize outline
  useEffect(() => {
    const el = outlineRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [outline])

  if (!idea) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen"
        style={{ backgroundColor: C.bg.base, color: C.text.muted, fontFamily: F.body, fontSize: '14px' }}
      >
        Idea not found.{' '}
        <button onClick={() => navigate('/ideas')} style={{ color: C.accent.red, background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 }}>
          Back to ideas
        </button>
      </div>
    )
  }

  const source = idea.source_platform_id
    ? feedItems.find((f) => f.platform_id === idea.source_platform_id) ?? null
    : null

  function saveTitle() {
    if (title !== idea!.title) updateIdea(idea!.id, { title })
  }

  function saveOutline() {
    if (outline !== idea!.outline) updateIdea(idea!.id, { outline })
  }

  function handleDelete() {
    if (confirm('Delete this idea?')) {
      deleteIdea(idea!.id)
      navigate('/ideas')
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <button
          onClick={() => navigate('/ideas')}
          className="flex items-center gap-2"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: C.text.muted,
            fontFamily: F.body,
            fontSize: '13px',
            padding: '4px 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Content Ideas
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: C.text.muted,
            fontFamily: F.body,
            fontSize: '13px',
            padding: '4px 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accent.red)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
        >
          <Trash2 size={14} strokeWidth={2} />
          Delete
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '48px 80px', maxWidth: '860px', width: '100%', margin: '0 auto' }}>
        {/* Title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          placeholder="Untitled idea"
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontFamily: F.display,
            fontSize: '32px',
            fontWeight: 700,
            color: C.text.primary,
            lineHeight: 1.25,
            marginBottom: '32px',
            resize: 'none',
            overflow: 'hidden',
          }}
        />

        {/* Outline label */}
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
          Outline
        </div>

        {/* Outline textarea */}
        <textarea
          ref={outlineRef}
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          onBlur={saveOutline}
          placeholder="Draft the hook, key points, CTA…"
          style={{
            width: '100%',
            minHeight: '240px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontFamily: F.body,
            fontSize: '15px',
            color: C.text.primary,
            lineHeight: 1.9,
            resize: 'none',
            overflow: 'hidden',
            letterSpacing: '0.01em',
          }}
        />

        {/* Enrich */}
        <button
          onClick={() => alert('Perplexity enrichment not yet wired up')}
          className="flex items-center gap-2"
          style={{
            marginTop: '32px',
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
        <div style={{ height: 1, backgroundColor: C.border.default, margin: '40px 0 24px' }} />

        {/* Source */}
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
              display: 'flex',
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
                {(source.title || source.body || '').replace(/\s+/g, ' ').trim().slice(0, 100)}
                {(source.title || source.body || '').length > 100 ? '…' : ''}
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
    </div>
  )
}
