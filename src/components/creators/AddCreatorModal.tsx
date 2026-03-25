import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'
import { Platform } from '../../types'
import { useStore, useShallow } from '../../store/useStore'
import { C, F, R } from '../../lib/tokens'

interface AddCreatorModalProps {
  onClose: () => void
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'reddit', label: 'Reddit' },
]

/** Best-effort handle extraction from a profile URL */
function deriveHandle(url: string, platform: Platform): string {
  try {
    const path = new URL(url).pathname.replace(/\/$/, '')
    const segment = path.split('/').filter(Boolean).pop() ?? ''
    if (!segment) return ''
    if (platform === 'youtube') return segment.startsWith('@') ? segment : `@${segment}`
    if (platform === 'reddit') return `r/${segment}` // e.g. /r/ClaudeAI → r/ClaudeAI
    return `@${segment.replace(/^@/, '')}`
  } catch {
    return ''
  }
}

const INITIAL_FORM = {
  name: '',
  platform: 'linkedin' as Platform,
  profile_url: '',
}

// ─── Platform dropdown ────────────────────────────────────────────────────────

function PlatformSelect({ value, onChange }: { value: Platform; onChange: (v: Platform) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = PLATFORMS.find((p) => p.value === value)!

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: C.bg.input,
          border: `1px solid ${open ? C.accent.red : C.border.default}`,
          borderRadius: open ? '8px 8px 0 0' : R.input,
          padding: '10px 14px',
          color: C.text.primary,
          fontFamily: F.body,
          fontSize: '14px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          boxShadow: open ? `0 0 0 2px rgba(232,50,50,0.12)` : 'none',
          boxSizing: 'border-box',
        }}
      >
        <span>{selected.label}</span>
        <ChevronDown
          size={14}
          style={{
            color: C.text.muted,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: C.bg.input,
            border: `1px solid ${C.accent.red}`,
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            zIndex: 200,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => { onChange(p.value); setOpen(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: value === p.value ? 'rgba(232,50,50,0.08)' : 'transparent',
                color: value === p.value ? C.accent.red : C.text.secondary,
                fontFamily: F.body,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (value !== p.value) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = C.text.primary
                }
              }}
              onMouseLeave={(e) => {
                if (value !== p.value) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = C.text.secondary
                }
              }}
            >
              <span>{p.label}</span>
              {value === p.value && <Check size={14} style={{ color: C.accent.red, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function AddCreatorModal({ onClose }: AddCreatorModalProps) {
  const addCreator = useStore(useShallow((s) => s.addCreator))
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<typeof INITIAL_FORM>>({})
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstInputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Clear errors as user types
  function setField<K extends keyof typeof INITIAL_FORM>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const e: Partial<typeof INITIAL_FORM> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.profile_url.trim()) e.profile_url = 'Required'
    else {
      try { new URL(form.profile_url.trim()) }
      catch { e.profile_url = 'Enter a valid URL' }
    }
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const url = form.profile_url.trim()
    const handle = deriveHandle(url, form.platform) || form.name.trim()

    addCreator({
      name: form.name.trim(),
      handle,
      platform: form.platform,
      profile_url: url,
    })
    setForm(INITIAL_FORM)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: C.bg.input,
    border: `1px solid ${C.border.default}`,
    borderRadius: R.input,
    padding: '10px 14px',
    color: C.text.primary,
    fontFamily: F.body,
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: F.mono,
    fontSize: '11px',
    color: C.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <div
      className="fixed flex items-center justify-center z-50"
      style={{
        top: 0, bottom: 0, left: '240px', right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: C.bg.surface,
          border: `1px solid ${C.border.default}`,
          borderRadius: R.modal,
          padding: '32px',
          maxWidth: '440px',
          width: '100%',
          margin: '0 16px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: F.display, fontSize: '20px', fontWeight: 700, color: C.text.primary }}>
            Add Creator
          </h2>
          <button
            onClick={onClose}
            style={{ color: C.text.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Creator Name */}
          <Field label="Creator Name" error={errors.name}>
            <input
              ref={firstInputRef}
              type="text"
              placeholder="e.g. Justin Welsh"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              style={{ ...inputStyle, borderColor: errors.name ? C.accent.red : C.border.default }}
              onFocus={(e) => (e.target.style.borderColor = errors.name ? C.accent.red : C.accent.red)}
              onBlur={(e) => (e.target.style.borderColor = errors.name ? C.accent.red : C.border.default)}
            />
          </Field>

          {/* Platform */}
          <div>
            <label style={labelStyle}>Platform</label>
            <PlatformSelect
              value={form.platform}
              onChange={(v) => setForm((f) => ({ ...f, platform: v }))}
            />
          </div>

          {/* URL */}
          <Field label="URL" error={errors.profile_url}>
            <input
              type="url"
              placeholder="https://linkedin.com/in/justinwelsh"
              value={form.profile_url}
              onChange={(e) => setField('profile_url', e.target.value)}
              style={{ ...inputStyle, borderColor: errors.profile_url ? C.accent.red : C.border.default }}
              onFocus={(e) => (e.target.style.borderColor = C.accent.red)}
              onBlur={(e) => (e.target.style.borderColor = errors.profile_url ? C.accent.red : C.border.default)}
            />
          </Field>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: R.input,
                backgroundColor: 'transparent',
                border: `1px solid ${C.border.default}`,
                color: C.text.secondary,
                fontFamily: F.body,
                fontSize: '14px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.border.hover; e.currentTarget.style.color = C.text.primary }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border.default; e.currentTarget.style.color = C.text.secondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: R.input,
                backgroundColor: C.accent.red,
                border: `1px solid ${C.accent.red}`,
                color: '#FFFFFF',
                fontFamily: F.body,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Add Creator
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            color: '#666666',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </label>
        {error && (
          <span style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '11px', color: '#E83232' }}>
            {error}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
