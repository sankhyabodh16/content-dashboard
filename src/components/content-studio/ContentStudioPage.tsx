import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Save, RefreshCw, ThumbsUp, MessageSquare, Repeat2, Send, Heart, BarChart2, Bookmark, Share, ChevronDown, Check, Lightbulb, X } from 'lucide-react'
import { C, F, R } from '../../lib/tokens'
import { useStore, useShallow } from '../../store/useStore'

const PLATFORMS = ['LinkedIn', 'X / Twitter', 'Reddit', 'YouTube', 'Instagram'] as const
type StudioPlatform = typeof PLATFORMS[number]

const PREVIEW_PLATFORMS = ['LinkedIn', 'X / Twitter'] as const
type PreviewPlatform = typeof PREVIEW_PLATFORMS[number]

const BRAND_VOICES = ['100 OPS Primary', 'Technical Deep Dive', 'Casual & Direct'] as const
type BrandVoice = typeof BRAND_VOICES[number]

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger */}
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
          borderRadius: open ? `${R.input} ${R.input} 0 0` : R.input,
          padding: '10px 14px',
          color: C.text.primary,
          fontFamily: F.body,
          fontSize: '14px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          boxShadow: open ? `0 0 0 2px rgba(232,50,50,0.12)` : 'none',
        }}
      >
        <span>{value}</span>
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

      {/* Dropdown list */}
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
            borderRadius: `0 0 ${R.input} ${R.input}`,
            zIndex: 100,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: value === opt ? 'rgba(232,50,50,0.08)' : 'transparent',
                color: value === opt ? C.accent.red : C.text.secondary,
                fontFamily: F.body,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (value !== opt) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = C.text.primary
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = C.text.secondary
                }
              }}
            >
              <span>{opt}</span>
              {value === opt && <Check size={14} style={{ color: C.accent.red, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── LinkedIn Preview ─────────────────────────────────────────────────────────
function LinkedInPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split('\n')
  const truncated = lines.slice(0, 3).join('\n')
  const needsExpand = lines.length > 3
  const preview = expanded ? text : truncated

  return (
    <div style={{ backgroundColor: '#1B1F23', borderRadius: '8px', border: '1px solid #38434F', overflow: 'hidden', maxWidth: '560px' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <div className="flex items-start gap-3">
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: '#E83232', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F.display, fontWeight: 700, fontSize: '18px', color: '#fff',
          }}>S</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p style={{ fontFamily: F.body, fontWeight: 600, fontSize: '14px', color: '#E7E3DC' }}>Sankhya</p>
                <p style={{ fontFamily: F.body, fontSize: '12px', color: '#B0B7BF', lineHeight: 1.4 }}>Founder · 100 OPS</p>
                <p style={{ fontFamily: F.body, fontSize: '12px', color: '#B0B7BF' }}>1st · Just now</p>
              </div>
              <button style={{
                fontFamily: F.body, fontWeight: 600, fontSize: '14px', flexShrink: 0,
                color: '#70B5F9', border: '1px solid #70B5F9', borderRadius: '9999px',
                padding: '5px 16px', backgroundColor: 'transparent', cursor: 'pointer',
              }}>+ Follow</button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <p style={{ fontFamily: F.body, fontSize: '14px', color: '#E7E3DC', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{preview}</p>
        {needsExpand && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ fontFamily: F.body, fontSize: '14px', color: '#70B5F9', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px' }}
          >
            {expanded ? 'see less' : '…see more'}
          </button>
        )}
      </div>
      <div style={{ padding: '4px 16px 8px', borderBottom: '1px solid #38434F' }}>
        <span style={{ fontFamily: F.body, fontSize: '12px', color: '#B0B7BF' }}>👍❤️ 0 reactions · 0 comments</span>
      </div>
      <div style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-around' }}>
        {[{ icon: ThumbsUp, label: 'Like' }, { icon: MessageSquare, label: 'Comment' }, { icon: Repeat2, label: 'Repost' }, { icon: Send, label: 'Send' }].map(({ icon: Icon, label }) => (
          <button key={label} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: F.body, fontWeight: 600, fontSize: '13px', color: '#B0B7BF',
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '4px',
          }}><Icon size={18} />{label}</button>
        ))}
      </div>
    </div>
  )
}

// ─── X / Twitter Preview ─────────────────────────────────────────────────────
function XPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split('\n')
  const truncated = lines.slice(0, 3).join('\n')
  const needsExpand = lines.length > 3
  const preview = expanded ? text : truncated

  return (
    <div style={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid #2F3336', overflow: 'hidden', maxWidth: '560px' }}>
      <div style={{ padding: '16px' }}>
        <div className="flex gap-3">
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: '#E83232', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F.display, fontWeight: 700, fontSize: '16px', color: '#fff',
          }}>S</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: '15px', color: '#E7E9EA' }}>Sankhya</span>
                <span style={{ fontFamily: F.body, fontSize: '15px', color: '#71767B', marginLeft: '4px' }}>@100ops · now</span>
              </div>
              <button style={{
                fontFamily: F.body, fontWeight: 700, fontSize: '14px', flexShrink: 0,
                color: '#000', backgroundColor: '#E7E9EA', border: 'none', borderRadius: '9999px',
                padding: '5px 16px', cursor: 'pointer',
              }}>Follow</button>
            </div>
            <p style={{ fontFamily: F.body, fontSize: '15px', color: '#E7E9EA', lineHeight: '1.6', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{preview}</p>
            {needsExpand && (
              <button
                onClick={() => setExpanded((e) => !e)}
                style={{ fontFamily: F.body, fontSize: '15px', color: '#1D9BF0', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '4px' }}
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', maxWidth: '400px', paddingLeft: '52px' }}>
          {[{ icon: MessageSquare }, { icon: Repeat2 }, { icon: Heart }, { icon: BarChart2 }].map(({ icon: Icon }, i) => (
            <button key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: F.mono, fontSize: '13px', color: '#71767B', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <Icon size={18} />
            </button>
          ))}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71767B', padding: '4px' }}><Bookmark size={18} /></button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71767B', padding: '4px' }}><Share size={18} /></button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ContentStudioPage() {
  const { activeIdeation, setActiveIdeation } = useStore(
    useShallow((s) => ({ activeIdeation: s.activeIdeation, setActiveIdeation: s.setActiveIdeation }))
  )
  const [topic, setTopic] = useState('')
  const [outline, setOutline] = useState('')
  const [platform, setPlatform] = useState<StudioPlatform>('LinkedIn')
  const [brandVoice, setBrandVoice] = useState<BrandVoice>('100 OPS Primary')
  const [output, setOutput] = useState('')
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>('LinkedIn')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [ideationBanner, setIdeationBanner] = useState<string | null>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  // Pre-fill from Ideation if activeIdeation is set
  useEffect(() => {
    if (activeIdeation) {
      setTopic(activeIdeation.topic)
      setOutline(activeIdeation.outline)
      setIdeationBanner(activeIdeation.topic)
      setActiveIdeation(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize output textarea to fit content
  useEffect(() => {
    const el = outputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(el.scrollHeight, 520) + 'px'
  }, [output])

  const canGenerate = topic.trim().length > 0 && outline.trim().length > 0

  function handleGenerate() {
    if (isGenerating) return
    if (!canGenerate) {
      const missing = !topic.trim() && !outline.trim()
        ? 'Topic and outline are required'
        : !topic.trim()
        ? 'Topic is required'
        : 'Outline is required'
      setGenerateError(missing)
      return
    }
    setGenerateError('')
    setIsGenerating(true)
    setOutput('')
    setTimeout(() => {
      setOutput(
        `Most content ops pipelines fail for the same reason:\n\nThey're built for volume, not signal.\n\nHere's what I've seen after working with 30+ founders:\n\n→ They scrape 200 posts a week\n→ They read 10\n→ They act on 2\n\nThe bottleneck isn't content. It's curation.\n\nThe fix isn't another tool. It's a tighter filter upstream.\n\nWe rebuilt ours around one question:\n"Would I actually change how we operate based on this?"\n\nIf no — it doesn't make it into the feed.\n\nNow we have 20 posts a week and act on 15.\n\nLess noise. More signal. Better decisions.`
      )
      setIsGenerating(false)
    }, 1200)
  }

  function handleSaveDraft() {
    // Placeholder — will save to Supabase drafts table
  }

  function renderPreview() {
    if (!output) return (
      <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted }}>
        Generate content above to see the platform preview
      </p>
    )
    if (previewPlatform === 'LinkedIn') return <LinkedInPreview text={output} />
    return <XPreview text={output} />
  }

  return (
    <div style={{ backgroundColor: C.bg.base, height: '100vh', overflowY: 'auto' }}>
      {/* Top bar */}
      <div className="flex items-center px-10 py-6" style={{ borderBottom: `1px solid ${C.border.default}` }}>
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}>
            Content Studio
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            AI-powered content creation across all platforms
          </p>
        </div>
      </div>

      {/* Ideation banner */}
      {ideationBanner && (
        <div
          className="flex items-center gap-3 px-10 py-3"
          style={{ backgroundColor: 'rgba(232,50,50,0.06)', borderBottom: `1px solid rgba(232,50,50,0.15)` }}
        >
          <Lightbulb size={14} style={{ color: C.accent.red, flexShrink: 0 }} />
          <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.secondary, flex: 1 }}>
            Writing from Ideation: <span style={{ color: C.text.primary }}>{ideationBanner}</span>
          </span>
          <button
            onClick={() => setIdeationBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text.muted, display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Two-column workspace */}
      <div className="flex px-10 py-8 gap-8 items-start">

        {/* Left panel — all inputs + preview (42%) */}
        <div className="flex flex-col gap-5" style={{ width: '42%', flexShrink: 0 }}>

          {/* Topic */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: F.mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text.muted }}>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setGenerateError('') }}
              placeholder="e.g. Why most content ops pipelines fail"
              style={{ backgroundColor: C.bg.input, border: `1px solid ${C.border.default}`, borderRadius: R.input, padding: '10px 14px', color: C.text.primary, fontFamily: F.body, fontSize: '14px', outline: 'none', transition: 'border-color 0.15s ease' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent.red)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border.default)}
            />
          </div>

          {/* Outline */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: F.mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text.muted }}>Outline</label>
            <textarea
              value={outline}
              onChange={(e) => { setOutline(e.target.value); setGenerateError('') }}
              placeholder="Key points, structure, angle, or bullet points to cover..."
              rows={6}
              style={{ backgroundColor: C.bg.input, border: `1px solid ${C.border.default}`, borderRadius: R.input, padding: '10px 14px', color: C.text.primary, fontFamily: F.body, fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.6', transition: 'border-color 0.15s ease' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent.red)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border.default)}
            />
          </div>

          {/* Platform + Brand Voice — single row */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ fontFamily: F.mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text.muted }}>Platform</label>
              <CustomSelect value={platform} options={PLATFORMS} onChange={setPlatform} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ fontFamily: F.mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text.muted }}>Brand Voice</label>
              <CustomSelect value={brandVoice} options={BRAND_VOICES} onChange={setBrandVoice} />
            </div>
          </div>

          {/* Generate */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{ fontFamily: F.display, fontSize: '14px', fontWeight: 600, padding: '12px 20px', borderRadius: R.input, border: 'none', backgroundColor: C.accent.red, color: '#fff', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease', opacity: isGenerating ? 0.7 : 1 }}
              onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = '#c42828' }}
              onMouseLeave={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = C.accent.red }}
            >
              <Sparkles size={15} />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            {generateError && (
              <p style={{ fontFamily: F.mono, fontSize: '11px', color: C.accent.red, textAlign: 'center' }}>{generateError}</p>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${C.border.default}`, marginTop: '4px' }} />

          {/* Preview */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span style={{ fontFamily: F.display, fontSize: '15px', fontWeight: 600, color: C.text.primary, flexShrink: 0 }}>Preview</span>
              <div style={{ width: '180px' }}>
                <CustomSelect value={previewPlatform} options={PREVIEW_PLATFORMS} onChange={setPreviewPlatform} />
              </div>
            </div>
            {renderPreview()}
          </div>

          <div style={{ height: '32px' }} />
        </div>

        {/* Right panel — generated output only (58%) */}
        <div className="flex flex-col flex-1 gap-4">

          {/* Output — editable textarea */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: F.mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text.muted }}>Output</label>
            {isGenerating ? (
              <div style={{ backgroundColor: C.bg.surface, border: `1px solid ${C.border.default}`, borderRadius: R.card, padding: '28px 32px', minHeight: '520px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.accent.red, marginTop: '3px', animation: 'pulse 1s infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: F.mono, fontSize: '13px', color: C.text.muted }}>Generating...</span>
              </div>
            ) : (
              <textarea
                ref={outputRef}
                value={output}
                onChange={(e) => { setOutput(e.target.value) }}
                placeholder="Output will appear here after generation. You can edit it directly."
                style={{ backgroundColor: C.bg.surface, border: `1px solid ${C.border.default}`, borderRadius: R.card, padding: '28px 32px', minHeight: '520px', color: output ? C.text.primary : C.text.muted, fontFamily: F.body, fontSize: '15px', lineHeight: '1.8', outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s ease', overflow: 'hidden', WebkitAppearance: 'none' } as React.CSSProperties}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.border.hover)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border.default)}
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={!output}
              style={{ flex: 1, fontFamily: F.display, fontSize: '14px', fontWeight: 600, padding: '12px 20px', borderRadius: R.input, border: 'none', backgroundColor: output ? C.accent.red : C.bg.elevated, color: output ? '#fff' : C.text.muted, cursor: output ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease' }}
              onMouseEnter={(e) => { if (output) e.currentTarget.style.backgroundColor = '#c42828' }}
              onMouseLeave={(e) => { if (output) e.currentTarget.style.backgroundColor = output ? C.accent.red : C.bg.elevated }}
            >
              <Save size={15} />Save Draft
            </button>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              style={{ flex: 1, fontFamily: F.display, fontSize: '14px', fontWeight: 600, padding: '12px 20px', borderRadius: R.input, border: `1px solid ${C.border.default}`, backgroundColor: 'transparent', color: canGenerate ? C.text.secondary : C.text.muted, cursor: canGenerate ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease' }}
              onMouseEnter={(e) => { if (canGenerate) e.currentTarget.style.color = C.text.primary }}
              onMouseLeave={(e) => { if (canGenerate) e.currentTarget.style.color = canGenerate ? C.text.secondary : C.text.muted }}
            >
              <RefreshCw size={15} />Re Generate
            </button>
          </div>

          <div style={{ height: '32px' }} />
        </div>
      </div>
    </div>
  )
}
