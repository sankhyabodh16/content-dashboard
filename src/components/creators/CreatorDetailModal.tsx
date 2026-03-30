import { useEffect, useRef, useState } from 'react'
import { X, RefreshCw, ExternalLink, Trash2, Pencil, Check, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Creator } from '../../types'
import { C, F, R, PLATFORM_COLORS } from '../../lib/tokens'
import { useStore, useShallow } from '../../store/useStore'
import PlatformBadge from '../ui/PlatformBadge'
import { timeAgo, formatDate } from '../../lib/utils'

interface Props {
  creator: Creator
  onClose: () => void
  onRemove: (id: string) => void
}

const WORKFLOW_MAP: Record<string, string> = {
  linkedin: 'scrape-linkedin.yml',
  reddit: 'scrape-reddit.yml',
  youtube: 'scrape-youtube.yml',
}

const PLATFORM_METRIC_LABELS: Record<string, { key: string; label: string }[]> = {
  linkedin: [
    { key: 'connections', label: 'Connections' },
    { key: 'followers', label: 'Followers' },
  ],
  youtube: [{ key: 'subscribers', label: 'Subscribers' }],
  twitter: [{ key: 'followers', label: 'Followers' }],
  instagram: [
    { key: 'followers', label: 'Followers' },
    { key: 'following', label: 'Following' },
  ],
  reddit: [{ key: 'members', label: 'Members' }],
}

/** Derive handle from a profile URL (last path segment) */
function deriveHandle(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/$/, '')
    const segment = path.split('/').filter(Boolean).pop() ?? ''
    if (!segment) return ''
    return `@${segment.replace(/^@/, '')}`
  } catch {
    return ''
  }
}

type ScrapePhase = 'idle' | 'dispatching' | 'queued' | 'running' | 'done' | 'failed' | 'timeout'

export default function CreatorDetailModal({ creator, onClose, onRemove }: Props) {
  const updateCreator = useStore(useShallow((s) => s.updateCreator))

  const [confirming, setConfirming] = useState(false)
  const [scrapePhase, setScrapePhase] = useState<ScrapePhase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef(0)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(creator.name)
  const [editUrl, setEditUrl] = useState(creator.profile_url ?? '')
  const [urlError, setUrlError] = useState('')

  const backdropRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const color = PLATFORM_COLORS[creator.platform] ?? '#666666'
  const metricDefs = PLATFORM_METRIC_LABELS[creator.platform] ?? []

  // Close on Escape (but not when editing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) { cancelEdit(); return }
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, editing])

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), [])

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  async function pollRun(workflowId: string, since: number) {
    const repo = import.meta.env.VITE_GITHUB_REPO
    const token = import.meta.env.VITE_GITHUB_TOKEN
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/${workflowId}/runs?per_page=5`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
      )
      if (!res.ok) return
      const data = await res.json()
      const run = data.workflow_runs?.find((r: { created_at: string; status: string; conclusion: string }) =>
        new Date(r.created_at).getTime() >= since - 15000
      )
      if (!run) return
      if (run.status === 'in_progress') {
        setScrapePhase('running')
      } else if (run.status === 'completed') {
        stopPolling()
        setScrapePhase(run.conclusion === 'success' ? 'done' : 'failed')
      }
    } catch {
      // network error — keep polling
    }
  }

  // Auto-cancel confirm state
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 4000)
    return () => clearTimeout(timer)
  }, [confirming])

  // Focus name input when edit mode opens
  useEffect(() => {
    if (editing) nameInputRef.current?.focus()
  }, [editing])

  function cancelEdit() {
    setEditing(false)
    setEditName(creator.name)
    setEditUrl(creator.profile_url ?? '')
    setUrlError('')
  }

  function saveEdit() {
    const trimmedUrl = editUrl.trim()
    if (trimmedUrl) {
      try { new URL(trimmedUrl) } catch { setUrlError('Enter a valid URL'); return }
    }
    setUrlError('')
    const handle =
      creator.platform === 'reddit'
        ? creator.handle // keep existing for Reddit
        : deriveHandle(trimmedUrl) || editName.trim()
    updateCreator(creator.id, {
      name: editName.trim() || creator.name,
      handle,
      profile_url: trimmedUrl || null,
    })
    setEditing(false)
  }

  async function handleScrapeNow() {
    const workflowId = WORKFLOW_MAP[creator.platform]
    if (!workflowId || scrapePhase !== 'idle') return
    const repo = import.meta.env.VITE_GITHUB_REPO
    const token = import.meta.env.VITE_GITHUB_TOKEN
    if (!repo || !token) { setScrapePhase('failed'); return }

    setScrapePhase('dispatching')
    const dispatchedAt = Date.now()

    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/${workflowId}/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({ ref: 'main', inputs: { creator_id: creator.id } }),
        }
      )
      if (!res.ok && res.status !== 204) { setScrapePhase('failed'); return }

      setScrapePhase('queued')
      startTimeRef.current = dispatchedAt
      setElapsed(0)

      elapsedRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      // Poll every 10s; timeout after 12 minutes
      setTimeout(() => pollRun(workflowId, dispatchedAt), 6000)
      pollRef.current = setInterval(() => pollRun(workflowId, dispatchedAt), 10000)
      timeoutRef.current = setTimeout(() => { stopPolling(); setScrapePhase('timeout') }, 12 * 60 * 1000)
    } catch {
      setScrapePhase('failed')
    }
  }

  function handleRemove() {
    if (!confirming) { setConfirming(true); return }
    onRemove(creator.id)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: C.bg.input,
    border: `1px solid ${C.border.default}`,
    borderRadius: '6px',
    padding: '8px 10px',
    color: C.text.primary,
    fontFamily: F.body,
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: C.bg.surface,
          border: `1px solid ${C.border.default}`,
          borderRadius: R.modal,
          width: '480px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Coloured top strip */}
        <div
          style={{
            background: `linear-gradient(135deg, ${color}30 0%, ${color}10 60%, transparent 100%)`,
            borderBottom: `1px solid ${color}25`,
            padding: '24px 24px 20px',
          }}
        >
          <div className="flex items-start justify-between">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: `${color}22`,
                  border: `2px solid ${color}50`,
                  color,
                  fontSize: '22px',
                  fontFamily: F.display,
                  fontWeight: 700,
                }}
              >
                {creator.name.charAt(0)}
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: F.display,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: C.text.primary,
                    lineHeight: 1.2,
                    marginBottom: '6px',
                  }}
                >
                  {creator.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
                    {creator.handle}
                  </span>
                  <PlatformBadge platform={creator.platform} size="sm" />
                </div>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-1">
              {/* Edit toggle */}
              <button
                onClick={() => editing ? cancelEdit() : setEditing(true)}
                title={editing ? 'Cancel edit' : 'Edit creator'}
                style={{
                  background: editing ? `${color}20` : 'none',
                  border: editing ? `1px solid ${color}40` : 'none',
                  borderRadius: '6px',
                  color: editing ? color : C.text.muted,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'flex',
                }}
                onMouseEnter={(e) => { if (!editing) e.currentTarget.style.color = C.text.primary }}
                onMouseLeave={(e) => { if (!editing) e.currentTarget.style.color = C.text.muted }}
              >
                <Pencil size={15} strokeWidth={2} />
              </button>
              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.text.muted,
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* ── Edit form ─────────────────────────────────────────── */}
          {editing && (
            <div
              className="flex flex-col gap-3 mb-5 p-4 rounded-lg"
              style={{ backgroundColor: C.bg.elevated, border: `1px solid ${color}30` }}
            >
              <div>
                <label style={{ fontFamily: F.mono, fontSize: '10px', color: C.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                  Name
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = color)}
                  onBlur={(e) => (e.target.style.borderColor = C.border.default)}
                />
              </div>
              <div>
                <label style={{ fontFamily: F.mono, fontSize: '10px', color: C.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                  Profile URL
                </label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => { setEditUrl(e.target.value); setUrlError('') }}
                  style={{ ...inputStyle, borderColor: urlError ? '#E83232' : C.border.default }}
                  onFocus={(e) => (e.target.style.borderColor = urlError ? '#E83232' : color)}
                  onBlur={(e) => (e.target.style.borderColor = urlError ? '#E83232' : C.border.default)}
                />
                {urlError && (
                  <span style={{ fontFamily: F.body, fontSize: '11px', color: '#E83232', marginTop: '4px', display: 'block' }}>
                    {urlError}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${C.border.default}`,
                    color: C.text.secondary,
                    fontFamily: F.body,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="flex items-center justify-center gap-1.5"
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: color,
                    border: 'none',
                    color: '#fff',
                    fontFamily: F.body,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={13} strokeWidth={2.5} />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Metrics grid */}
          {metricDefs.length > 0 && (
            <div
              className="grid mb-5"
              style={{
                gridTemplateColumns: `repeat(${metricDefs.length + 1}, 1fr)`,
                gap: '12px',
              }}
            >
              {metricDefs.map((m) => (
                <MetricBlock
                  key={m.key}
                  label={m.label}
                  value={creator.metrics?.[m.key] ?? creator.followers ?? '—'}
                  color={color}
                />
              ))}
              <MetricBlock label="Posts Scraped" value={creator.posts_scraped.toLocaleString()} />
            </div>
          )}

          {/* Meta info */}
          <div
            className="flex flex-col gap-2 mb-6 p-4 rounded-lg"
            style={{ backgroundColor: C.bg.elevated, border: `1px solid ${C.border.subtle}` }}
          >
            <MetaRow label="Last Scraped" value={creator.last_scraped ? timeAgo(creator.last_scraped) : 'Never'} />
            <MetaRow label="Added" value={formatDate(creator.created_at)} />
            {creator.profile_url && (
              <MetaRow label="Profile URL" value={creator.profile_url} isLink />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleScrapeNow}
              disabled={scrapePhase !== 'idle' || !WORKFLOW_MAP[creator.platform]}
              className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 justify-center"
              style={{
                backgroundColor: scrapePhase !== 'idle' ? `${color}18` : C.bg.elevated,
                border: `1px solid ${scrapePhase !== 'idle' ? color + '50' : C.border.default}`,
                color: scrapePhase !== 'idle' ? color : C.text.secondary,
                fontFamily: F.mono,
                fontSize: '12px',
                cursor: scrapePhase !== 'idle' || !WORKFLOW_MAP[creator.platform] ? 'not-allowed' : 'pointer',
                letterSpacing: '0.03em',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (scrapePhase === 'idle') { e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.color = color } }}
              onMouseLeave={(e) => { if (scrapePhase === 'idle') { e.currentTarget.style.borderColor = C.border.default; e.currentTarget.style.color = C.text.secondary } }}
            >
              {scrapePhase === 'dispatching'
                ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                : <RefreshCw size={13} strokeWidth={2} />
              }
              {scrapePhase === 'dispatching' ? 'Queuing…' : scrapePhase === 'idle' ? 'Scrape Now' : 'Scraping…'}
            </button>

            {creator.profile_url && (
              <a
                href={creator.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 justify-center"
                style={{
                  backgroundColor: C.bg.elevated,
                  border: `1px solid ${C.border.default}`,
                  color: C.text.secondary,
                  fontFamily: F.mono,
                  fontSize: '12px',
                  cursor: 'pointer',
                  letterSpacing: '0.03em',
                  textDecoration: 'none',
                  display: 'flex',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.color = color }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border.default; e.currentTarget.style.color = C.text.secondary }}
              >
                <ExternalLink size={13} strokeWidth={2} />
                View Profile
              </a>
            )}

            <button
              onClick={handleRemove}
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                backgroundColor: confirming ? '#E8323215' : C.bg.elevated,
                border: `1px solid ${confirming ? '#E83232' : C.border.default}`,
                color: confirming ? '#E83232' : C.text.muted,
                fontFamily: F.mono,
                fontSize: '12px',
                cursor: 'pointer',
                letterSpacing: '0.03em',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!confirming) { e.currentTarget.style.borderColor = '#E83232'; e.currentTarget.style.color = '#E83232' } }}
              onMouseLeave={(e) => { if (!confirming) { e.currentTarget.style.borderColor = C.border.default; e.currentTarget.style.color = C.text.muted } }}
            >
              <Trash2 size={13} strokeWidth={2} />
              {confirming ? 'Confirm?' : 'Remove'}
            </button>
          </div>

          {/* Scrape progress bar */}
          {scrapePhase !== 'idle' && (
            <ScrapeProgress phase={scrapePhase} elapsed={elapsed} color={color} />
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatElapsed(s: number) {
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

const PHASE_CONFIG = {
  dispatching: { label: 'Dispatching…',              width: '5%',   pulse: true  },
  queued:      { label: 'Queued — waiting to start', width: '15%',  pulse: true  },
  running:     { label: 'Running…',                  width: '65%',  pulse: true  },
  done:        { label: 'Done — new posts incoming', width: '100%', pulse: false },
  failed:      { label: 'Failed',                    width: '100%', pulse: false },
  timeout:     { label: 'Still running — check GitHub Actions', width: '85%', pulse: false },
  idle:        { label: '',                          width: '0%',   pulse: false },
}

function ScrapeProgress({ phase, elapsed, color }: { phase: string; elapsed: number; color: string }) {
  const cfg = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG]
  const barColor = phase === 'failed' ? '#E83232' : phase === 'done' ? '#22c55e' : color
  const showElapsed = phase === 'queued' || phase === 'running'

  return (
    <div
      style={{
        padding: '10px 12px',
        backgroundColor: C.bg.elevated,
        borderRadius: '8px',
        border: `1px solid ${C.border.subtle}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {phase === 'done' && <CheckCircle2 size={12} color="#22c55e" strokeWidth={2} />}
          {phase === 'failed' && <XCircle size={12} color="#E83232" strokeWidth={2} />}
          <span style={{ fontFamily: F.mono, fontSize: '11px', color: phase === 'failed' ? '#E83232' : phase === 'done' ? '#22c55e' : color }}>
            {cfg.label}
          </span>
        </div>
        {showElapsed && (
          <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted }}>
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>
      <div style={{ height: '3px', backgroundColor: C.bg.surface, borderRadius: '2px', overflow: 'hidden' }}>
        <div
          className={cfg.pulse ? 'animate-pulse' : ''}
          style={{
            height: '100%',
            width: cfg.width,
            backgroundColor: barColor,
            borderRadius: '2px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

function MetricBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-3 rounded-lg"
      style={{ backgroundColor: C.bg.elevated, border: `1px solid ${C.border.subtle}` }}
    >
      <span style={{ fontFamily: F.mono, fontSize: '10px', color: C.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{ fontFamily: F.display, fontSize: '22px', fontWeight: 700, color: color ?? C.text.primary, lineHeight: 1 }}>
        {value}
      </span>
    </div>
  )
}

function MetaRow({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
        {label}
      </span>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: F.body, fontSize: '12px', color: C.accent.red, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {value}
        </a>
      ) : (
        <span style={{ fontFamily: F.body, fontSize: '13px', color: C.text.secondary }}>{value}</span>
      )}
    </div>
  )
}
