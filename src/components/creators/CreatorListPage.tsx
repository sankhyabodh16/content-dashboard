import { useState, useMemo } from 'react'
import { Plus, Users } from 'lucide-react'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R, PLATFORM_COLORS } from '../../lib/tokens'
import { Creator, Platform } from '../../types'
import AddCreatorModal from './AddCreatorModal'
import CreatorDetailModal from './CreatorDetailModal'
import EmptyState from '../ui/EmptyState'
import { timeAgo } from '../../lib/utils'

// ─── Platform config ─────────────────────────────────────────────────────────

interface MetricColumn {
  label: string
  metricKey: string
}

interface PlatformConfig {
  label: string
  color: string
  abbr: string
  col1: MetricColumn
  col2: MetricColumn | null
}

const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    abbr: 'in',
    col1: { label: 'Connections', metricKey: 'connections' },
    col2: { label: 'Followers', metricKey: 'followers' },
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    abbr: '▶',
    col1: { label: 'Subscribers', metricKey: 'subscribers' },
    col2: null,
  },
  twitter: {
    label: 'Twitter / X',
    color: '#E7E9EA',
    abbr: 'X',
    col1: { label: 'Followers', metricKey: 'followers' },
    col2: null,
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    abbr: '◎',
    col1: { label: 'Followers', metricKey: 'followers' },
    col2: { label: 'Following', metricKey: 'following' },
  },
  reddit: {
    label: 'Reddit',
    color: '#FF4500',
    abbr: '◈',
    col1: { label: 'Members', metricKey: 'members' },
    col2: null,
  },
}

const PLATFORM_ORDER: Platform[] = ['linkedin', 'youtube', 'twitter', 'instagram', 'reddit']

function getMetric(creator: Creator, key: string): string {
  // LinkedIn connection_count is a direct column, not in metrics
  if (key === 'connections') {
    const v = creator.connection_count
    return v != null && v !== 0 ? v.toLocaleString() : '—'
  }
  const v = creator.metrics?.[key] ?? creator.followers ?? null
  if (!v || v === '0') return '—'
  return Number(v) ? Number(v).toLocaleString() : v
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatorListPage() {
  const { creators, feedItems, removeCreator } = useStore(
    useShallow((s) => ({ creators: s.creators, feedItems: s.feedItems, removeCreator: s.removeCreator }))
  )
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Creator | null>(null)

  const grouped = useMemo(() => {
    const map: Partial<Record<Platform, Creator[]>> = {}
    for (const c of creators) {
      if (!map[c.platform]) map[c.platform] = []
      map[c.platform]!.push(c)
    }
    return map
  }, [creators])

  const postsByCreator = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of feedItems) {
      if (!item.creator_id) continue
      map[item.creator_id] = (map[item.creator_id] ?? 0) + 1
    }
    return map
  }, [feedItems])

  const totalPosts = useMemo(
    () => creators.reduce((acc, c) => acc + (postsByCreator[c.id] ?? 0), 0),
    [creators, postsByCreator],
  )

  const platforms = PLATFORM_ORDER.filter((p) => grouped[p]?.length)

  return (
    <div className="px-10 py-8" style={{ backgroundColor: C.bg.base, minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
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
            Creator List
          </h1>
          <p
            style={{
              fontFamily: F.body,
              fontSize: '14px',
              color: C.text.muted,
              marginTop: '4px',
            }}
          >
            Track and monitor creators across platforms
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5"
          style={{
            backgroundColor: C.accent.red,
            color: '#FFFFFF',
            fontFamily: F.body,
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} strokeWidth={2} />
          Add Creator
        </button>
      </div>

      {creators.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No creators yet"
          subtitle="Add your first creator to start tracking their content across platforms"
          action={{ label: 'Add Creator', onClick: () => setShowModal(true) }}
        />
      ) : (
        <>
          {/* Top stats */}
          <div
            className="flex items-center gap-8 mb-8 px-6 py-4 rounded-xl"
            style={{ backgroundColor: C.bg.surface, border: `1px solid ${C.border.default}` }}
          >
            <TopStat label="Total Creators" value={creators.length.toString()} />
            <Divider />
            <TopStat label="Total Posts Scraped" value={totalPosts.toLocaleString()} />
            <Divider />
            <TopStat label="Platforms Active" value={platforms.length.toString()} />
          </div>

          {/* Platform groups */}
          <div className="flex flex-col gap-6">
            {platforms.map((platform) => (
              <PlatformGroup
                key={platform}
                platform={platform}
                creators={grouped[platform]!}
                postsByCreator={postsByCreator}
                onCreatorClick={setSelected}
              />
            ))}
          </div>
        </>
      )}

      {showModal && <AddCreatorModal onClose={() => setShowModal(false)} />}
      {selected && (
        <CreatorDetailModal
          creator={selected}
          onClose={() => setSelected(null)}
          onRemove={(id) => { removeCreator(id); setSelected(null) }}
        />
      )}
    </div>
  )
}

// ─── Platform group ───────────────────────────────────────────────────────────

function PlatformGroup({ platform, creators, postsByCreator, onCreatorClick }: { platform: Platform; creators: Creator[]; postsByCreator: Record<string, number>; onCreatorClick: (c: Creator) => void }) {
  const config = PLATFORM_CONFIG[platform]
  const color = config.color

  // Determine grid columns: with or without col2
  const hasCol2 = config.col2 !== null
  const gridCols = hasCol2
    ? '2fr 130px 120px 80px 110px'
    : '2fr 150px 80px 110px'

  return (
    <div
      style={{
        borderRadius: R.card,
        overflow: 'hidden',
        border: `1px solid ${color}30`,
      }}
    >
      {/* Section header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${color}18 0%, ${color}08 50%, transparent 100%)`,
          borderBottom: `1px solid ${color}25`,
          padding: '18px 24px',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left: platform identity */}
          <div className="flex items-center gap-4">
            {/* Platform icon */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: R.sm,
                backgroundColor: `${color}22`,
                border: `1px solid ${color}40`,
                color,
                fontFamily: F.mono,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              {config.abbr}
            </div>
            <div>
              <div
                style={{
                  fontFamily: F.display,
                  fontSize: '20px',
                  fontWeight: 700,
                  color,
                  lineHeight: 1.2,
                }}
              >
                {config.label}
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: '11px',
                  color: C.text.muted,
                  marginTop: '2px',
                }}
              >
                {creators.length} creator{creators.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: C.bg.surface }}>
        {/* Column headers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: gridCols,
            padding: '8px 24px',
            borderBottom: `1px solid ${C.border.subtle}`,
          }}
        >
          {['Name', config.col1.label, ...(hasCol2 ? [config.col2!.label] : []), 'Posts', 'Last Scraped'].map((col) => (
            <span
              key={col}
              style={{
                fontFamily: F.mono,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: C.text.muted,
              }}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        {creators.map((creator, i) => (
          <CreatorRow
            key={creator.id}
            creator={creator}
            config={config}
            color={color}
            gridCols={gridCols}
            hasCol2={hasCol2}
            postsCount={postsByCreator[creator.id] ?? 0}
            isLast={i === creators.length - 1}
            onClick={() => onCreatorClick(creator)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Creator row ──────────────────────────────────────────────────────────────

function CreatorRow({
  creator,
  config,
  color,
  gridCols,
  hasCol2,
  postsCount,
  isLast,
  onClick,
}: {
  creator: Creator
  config: PlatformConfig
  color: string
  gridCols: string
  hasCol2: boolean
  postsCount: number
  isLast: boolean
  onClick: () => void
}) {
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: gridCols,
        padding: '13px 24px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border.subtle}`,
        transition: 'background-color 0.1s ease',
        cursor: 'pointer',
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Name + avatar */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: `${color}20`,
            border: `1px solid ${color}35`,
            color,
            fontSize: '12px',
            fontFamily: F.display,
            fontWeight: 700,
          }}
        >
          {creator.name.charAt(0)}
        </div>
        <div className="flex flex-col min-w-0">
          <span
            style={{
              fontFamily: F.display,
              fontSize: '14px',
              fontWeight: 600,
              color: C.text.primary,
              lineHeight: 1.3,
            }}
          >
            {creator.name}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted }}>
            {creator.handle}
          </span>
        </div>
      </div>

      {/* Primary metric */}
      <MetricCell value={getMetric(creator, config.col1.metricKey)} color={color} />

      {/* Secondary metric (conditional) */}
      {hasCol2 && (
        <MetricCell value={getMetric(creator, config.col2!.metricKey)} color={color} dimmed />
      )}

      {/* Posts scraped */}
      <span style={{ fontFamily: F.mono, fontSize: '13px', color: C.text.primary }}>
        {postsCount.toLocaleString()}
      </span>

      {/* Last scraped */}
      <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
        {creator.last_scraped ? timeAgo(creator.last_scraped) : 'Never'}
      </span>

    </div>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function MetricCell({ value, color, dimmed }: { value: string; color: string; dimmed?: boolean }) {
  return (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: '14px',
        fontWeight: 600,
        color: dimmed ? C.text.secondary : color,
        letterSpacing: '0.01em',
      }}
    >
      {value}
    </span>
  )
}

function AggStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        style={{
          fontFamily: F.mono,
          fontSize: '10px',
          color: C.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span
        style={{ fontFamily: F.display, fontSize: '18px', fontWeight: 700, color, lineHeight: 1 }}
      >
        {value}
      </span>
    </div>
  )
}

function TopStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        style={{
          fontFamily: F.mono,
          fontSize: '10px',
          color: C.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: F.display,
          fontSize: '22px',
          fontWeight: 700,
          color: C.text.primary,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '36px', backgroundColor: C.border.default }} />
}

// Rough aggregate: just return the first creator's primary metric for now
// (real aggregation would sum parsed follower counts)
function aggregateFollowers(creators: Creator[], key: string): string {
  // Collect all values, try to parse and sum
  let totalM = 0
  let totalK = 0
  let hasData = false
  for (const c of creators) {
    const raw = c.metrics?.[key] ?? ''
    if (!raw) continue
    hasData = true
    if (raw.endsWith('M')) totalM += parseFloat(raw)
    else if (raw.endsWith('K')) totalK += parseFloat(raw)
  }
  if (!hasData) return '—'
  const total = totalM + totalK / 1000
  if (total >= 1) return `${total.toFixed(1)}M`
  return `${(total * 1000).toFixed(0)}K`
}
