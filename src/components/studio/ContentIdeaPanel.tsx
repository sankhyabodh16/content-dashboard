import { useEffect, useRef, useState } from 'react'
import { X, Sparkles, Trash2, Link2 } from 'lucide-react'
import { ContentIdea } from '../../types'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import FeedCard from '../feed/FeedCard'

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
  const outlineRef = useRef<HTMLTextAreaElement>(null)

  // Sync local state when switching between ideas
  useEffect(() => {
    setTitle(idea.title)
    setOutline(idea.outline)
  }, [idea.id])

  // Autosize outline textarea
  useEffect(() => {
    const el = outlineRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [outline])

  const source = idea.source_platform_id
    ? feedItems.find((f) => f.platform_id === idea.source_platform_id) ?? null
    : null

  function saveTitle() {
    if (title !== idea.title) updateIdea(idea.id, { title })
  }

  function saveOutline() {
    if (outline !== idea.outline) updateIdea(idea.id, { outline })
  }

  function handleDelete() {
    if (confirm('Delete this idea?')) {
      deleteIdea(idea.id)
      onClose()
    }
  }

  function handleEnrich() {
    // TODO: wire Perplexity integration
    alert('Perplexity enrichment not yet wired up')
  }

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen"
      style={{
        width: '560px',
        backgroundColor: C.bg.sidebar,
        borderLeft: `1px solid ${C.border.default}`,
      }}
    >
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
            style={{
              width: 28,
              height: 28,
              borderRadius: R.sm,
              background: 'transparent',
              border: 'none',
              color: C.text.muted,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.accent.red)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
            title="Delete idea"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: R.sm,
              background: 'transparent',
              border: 'none',
              color: C.text.muted,
              cursor: 'pointer',
            }}
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
            minHeight: '360px',
            background: C.bg.surface,
            border: `1px solid ${C.border.default}`,
            borderRadius: R.input,
            padding: '16px 18px',
            outline: 'none',
            fontFamily: F.body,
            fontSize: '14px',
            color: C.text.primary,
            lineHeight: 1.7,
            resize: 'none',
            overflow: 'hidden',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.border.hover)}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = C.border.default)}
        />

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
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.accent.green
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${C.accent.green}50`
          }}
        >
          <Sparkles size={14} strokeWidth={2} />
          Enrich With Perplexity
        </button>

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: C.border.default,
            margin: '32px 0 20px',
          }}
        />

        {/* Source section */}
        <div
          style={{
            fontFamily: F.mono,
            fontSize: '11px',
            color: C.text.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Source
        </div>

        {source ? (
          <FeedCard item={source} />
        ) : (
          <div
            className="flex items-center gap-3"
            style={{
              padding: '16px 18px',
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
