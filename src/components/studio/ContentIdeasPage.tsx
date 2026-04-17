import { useState } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'
import EmptyState from '../ui/EmptyState'
import ContentIdeaPanel from './ContentIdeaPanel'
import { timeAgo } from '../../lib/utils'

export default function ContentIdeasPage() {
  const { contentIdeas, createIdea } = useStore(
    useShallow((s) => ({ contentIdeas: s.contentIdeas, createIdea: s.createIdea }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeIdea = activeId ? contentIdeas.find((i) => i.id === activeId) ?? null : null

  async function handleNew() {
    const created = await createIdea(null)
    if (created) setActiveId(created.id)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Left — list */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-10 py-6 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border.default}` }}
        >
          <div>
            <h1
              style={{
                fontFamily: F.display,
                fontSize: '28px',
                fontWeight: 700,
                color: C.text.primary,
                lineHeight: 1.2,
              }}
            >
              Content Ideas
            </h1>
            <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
              {contentIdeas.length} {contentIdeas.length === 1 ? 'idea' : 'ideas'}
            </p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2"
            style={{
              padding: '10px 14px',
              borderRadius: R.input,
              backgroundColor: C.accent.red,
              color: '#FFFFFF',
              fontFamily: F.body,
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} strokeWidth={2.2} />
            New idea
          </button>
        </div>

        {/* List */}
        {contentIdeas.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col items-center">
            <EmptyState
              icon={Sparkles}
              title="No ideas yet"
              subtitle="Click 'New idea' to start, or run the ideation skill on your Library"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-10 py-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {contentIdeas.map((idea) => {
                const isActive = idea.id === activeId
                return (
                  <button
                    key={idea.id}
                    onClick={() => setActiveId(idea.id)}
                    className="flex items-center gap-3"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: R.input,
                      backgroundColor: isActive ? 'rgba(232,50,50,0.08)' : 'transparent',
                      border: `1px solid ${isActive ? `${C.accent.red}40` : C.border.default}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.borderColor = C.border.hover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.borderColor = C.border.default
                      }
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: R.sm,
                        backgroundColor: 'rgba(232,50,50,0.12)',
                        border: `1px solid rgba(232,50,50,0.25)`,
                        color: C.accent.red,
                      }}
                    >
                      <Sparkles size={14} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontFamily: F.body,
                          fontSize: '14px',
                          fontWeight: 500,
                          color: idea.title ? C.text.primary : C.text.muted,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {idea.title || 'Untitled idea'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: '11px',
                        color: C.text.muted,
                        flexShrink: 0,
                      }}
                    >
                      {timeAgo(idea.updated_at || idea.created_at)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right — side panel */}
      {activeIdea && (
        <ContentIdeaPanel
          key={activeIdea.id}
          idea={activeIdea}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  )
}
