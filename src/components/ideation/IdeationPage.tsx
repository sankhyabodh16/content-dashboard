import { useState } from 'react'
import { Lightbulb, Trash2 } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F } from '../../lib/tokens'
import IdeationCard from './IdeationCard'
import EmptyState from '../ui/EmptyState'

export default function IdeationPage() {
  const ideationItems = useStore(useShallow((s) => s.ideationItems))
  const deleteIdeationItems = useStore((s) => s.deleteIdeationItems)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    setSelected(new Set())
    await deleteIdeationItems(ids)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-10 py-6 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}>
            Ideation
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            Topics and outlines generated from your List
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Bulk delete bar */}
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
                {selected.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: F.mono,
                  fontSize: '12px',
                  color: C.accent.red,
                  background: 'none',
                  border: `1px solid ${C.accent.red}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  padding: '5px 12px',
                  letterSpacing: '0.03em',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Trash2 size={13} strokeWidth={2} /> Delete {selected.size}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                style={{
                  fontFamily: F.mono,
                  fontSize: '12px',
                  color: C.text.muted,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
            {ideationItems.length} {ideationItems.length === 1 ? 'idea' : 'ideas'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        {ideationItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={Lightbulb}
              title="No ideas yet"
              subtitle="Add content to your List — Claude will generate topics and outlines automatically"
            />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {ideationItems.map((item) => (
              <IdeationCard
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
