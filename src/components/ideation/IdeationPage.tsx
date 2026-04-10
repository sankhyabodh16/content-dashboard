import { Lightbulb } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F } from '../../lib/tokens'
import IdeationCard from './IdeationCard'
import EmptyState from '../ui/EmptyState'

export default function IdeationPage() {
  const ideationItems = useStore(useShallow((s) => s.ideationItems))

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
        <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
          {ideationItems.length} {ideationItems.length === 1 ? 'idea' : 'ideas'}
        </span>
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
              <IdeationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
