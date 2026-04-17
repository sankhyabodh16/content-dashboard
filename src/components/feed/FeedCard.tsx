import { useState } from 'react'
import { ExternalLink, X, BookmarkPlus, BookmarkMinus, ChevronLeft, ChevronRight } from 'lucide-react'
import { FeedItem } from '../../types'
import { useStore, useShallow } from '../../store/useStore'
import { timeAgo } from '../../lib/utils'
import { C, F, R } from '../../lib/tokens'
import PlatformBadge from '../ui/PlatformBadge'

interface FeedCardProps {
  item: FeedItem
}

function PostBody({ body, expanded }: { body: string; expanded: boolean }) {
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0)
  return (
    <div style={{ fontFamily: F.body, fontSize: '14px', color: C.text.secondary, lineHeight: 1.7 }}>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? '10px' : 0 }}>
          {para}
        </p>
      ))}
    </div>
  )
}

function MediaFallback({ postUrl, label }: { postUrl?: string; label: string }) {
  return (
    <a
      href={postUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 mb-3"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: R.input,
        backgroundColor: C.bg.elevated,
        border: `1px solid ${C.border.default}`,
        color: C.text.muted,
        textDecoration: 'none',
        fontFamily: F.mono,
        fontSize: '12px',
        letterSpacing: '0.03em',
        marginBottom: '12px',
        transition: 'border-color 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.border.hover
        e.currentTarget.style.color = C.text.secondary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border.default
        e.currentTarget.style.color = C.text.muted
      }}
    >
      <ExternalLink size={14} strokeWidth={1.8} />
      <span>{label}</span>
    </a>
  )
}

function ImageCarousel({ urls, postUrl }: { urls: string[]; postUrl?: string }) {
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  if (urls.length === 0) return null
  if (failed) return <MediaFallback postUrl={postUrl} label={`View ${urls.length > 1 ? `${urls.length} images` : 'image'} on platform →`} />
  return (
    <div className="mb-3" style={{ borderRadius: R.input, overflow: 'hidden', position: 'relative', backgroundColor: C.bg.base }}>
      <img
        src={urls[idx]}
        alt=""
        referrerPolicy="no-referrer"
        style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'contain' }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? C.text.muted : C.text.primary,
              opacity: idx === 0 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(urls.length - 1, i + 1))}
            disabled={idx === urls.length - 1}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: idx === urls.length - 1 ? 'default' : 'pointer',
              color: idx === urls.length - 1 ? C.text.muted : C.text.primary,
              opacity: idx === urls.length - 1 ? 0.4 : 1,
            }}
          >
            <ChevronRight size={16} />
          </button>
          <div
            style={{
              position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 5,
            }}
          >
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 6, height: 6, borderRadius: '50%', border: 'none', padding: 0,
                  background: i === idx ? C.text.primary : C.text.muted,
                  cursor: 'pointer', opacity: i === idx ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function FeedCard({ item }: FeedCardProps) {
  const { toggleLibrary, hidePost } = useStore(
    useShallow((s) => ({ toggleLibrary: s.toggleLibrary, hidePost: s.hidePost }))
  )
  const [expanded, setExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const displayAuthor = item.subreddit ? item.subreddit : item.author

  const images = item.image_urls ?? []
  const videos = item.video_urls ?? []
  const hasMedia = images.length > 0 || videos.length > 0 || !!item.thumbnail_url

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: C.bg.surface,
        border: `1px solid ${isHovered ? C.border.hover : C.border.default}`,
        borderRadius: R.card,
        padding: '20px 24px',
        marginBottom: '16px',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Row 1: Platform + Author + Time + Dismiss */}
      <div className="flex items-center gap-2 mb-3">
        <PlatformBadge platform={item.platform} />
        <span style={{ color: C.border.default, fontSize: '14px' }}>·</span>
        <span style={{ fontFamily: F.body, fontSize: '14px', color: C.text.secondary, fontWeight: 500 }}>
          {displayAuthor}
        </span>
        {item.handle && item.handle !== displayAuthor && (
          <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
            {item.handle}
          </span>
        )}
        <span style={{ color: C.border.default, fontSize: '14px' }}>·</span>
        <span style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
          {timeAgo(item.created_at || item.scraped_at)}
        </span>
        <button
          onClick={() => hidePost(item.platform_id)}
          className="ml-auto flex items-center justify-center rounded-md p-1"
          style={{ color: C.text.muted, background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
          title="Dismiss"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Title */}
      {item.title && (
        <h3
          className="mb-2 cursor-pointer"
          style={{ fontFamily: F.display, fontSize: '16px', fontWeight: 600, color: C.text.primary, lineHeight: 1.4 }}
          onClick={() => setExpanded(!expanded)}
        >
          {item.title}
        </h3>
      )}

      {/* Body — smooth max-height expand */}
      {item.body && (
        <div className="mb-3">
          <div
            style={expanded ? {} : {
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            <PostBody body={item.body} expanded={expanded} />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              fontFamily: F.mono,
              fontSize: '12px',
              color: C.accent.red,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginTop: '6px',
              outline: 'none',
            }}
          >
            {expanded ? 'Show less' : 'View more'}
          </button>
        </div>
      )}

      {/* Media: images carousel → video fallback → thumbnail */}
      {images.length > 0 && <ImageCarousel urls={images} postUrl={item.post_url ?? undefined} />}
      {images.length === 0 && videos.length > 0 && (
        <div className="mb-3" style={{ borderRadius: R.input, overflow: 'hidden', backgroundColor: C.bg.base }}>
          <video
            src={videos[0]}
            controls
            preload="metadata"
            style={{ width: '100%', display: 'block', maxHeight: '480px' }}
          />
        </div>
      )}
      {images.length === 0 && videos.length === 0 && item.thumbnail_url && (
        <div className="mb-3" style={{ borderRadius: R.input, overflow: 'hidden' }}>
          <img
            src={item.thumbnail_url}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      )}

      {/* Engagement row */}
      {(() => {
        const stats: { icon: string; value: number; label: string }[] = []
        if (item.platform === 'linkedin') {
          if (item.likes > 0)          stats.push({ icon: '👍', value: item.likes,          label: 'likes' })
          if (item.comments_count > 0) stats.push({ icon: '💬', value: item.comments_count, label: 'comments' })
          if (item.shares_count > 0)   stats.push({ icon: '🔁', value: item.shares_count,   label: 'shares' })
        } else if (item.platform === 'youtube') {
          if (item.views_count > 0)    stats.push({ icon: '👁', value: item.views_count,    label: 'views' })
          if (item.likes > 0)          stats.push({ icon: '👍', value: item.likes,          label: 'likes' })
          if (item.comments_count > 0) stats.push({ icon: '💬', value: item.comments_count, label: 'comments' })
        } else if (item.platform === 'reddit') {
          if (item.likes > 0)          stats.push({ icon: '⬆', value: item.likes,          label: 'upvotes' })
          if (item.comments_count > 0) stats.push({ icon: '💬', value: item.comments_count, label: 'comments' })
        }
        if (stats.length === 0) return null
        return (
          <div className="flex items-center gap-4 mb-3">
            {stats.map((s) => (
              <span key={s.label} style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted }}>
                {s.icon} {s.value.toLocaleString()}
              </span>
            ))}
          </div>
        )
      })()}

      {/* Action row */}
      <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${C.border.subtle}` }}>
        {item.post_url ? (
          <a
            href={item.post_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original"
            className="flex items-center justify-center rounded-md p-1.5"
            style={{ color: C.text.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
          >
            <ExternalLink size={16} strokeWidth={1.8} />
          </a>
        ) : (
          <ActionButton title="Open original">
            <ExternalLink size={16} strokeWidth={1.8} />
          </ActionButton>
        )}
        <ActionButton onClick={() => hidePost(item.platform_id)} title="Archive post">
          <X size={16} strokeWidth={1.8} />
        </ActionButton>
        {/* Save to Library — right side */}
        <button
          onClick={() => toggleLibrary(item.platform_id)}
          className="ml-auto flex items-center gap-1.5"
          style={{
            fontFamily: F.mono,
            fontSize: '12px',
            color: item.is_bookmarked ? C.accent.red : C.text.muted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: R.sm,
            transition: 'color 0.15s ease',
            letterSpacing: '0.03em',
          }}
          onMouseEnter={(e) => {
            if (!item.is_bookmarked) e.currentTarget.style.color = C.text.primary
          }}
          onMouseLeave={(e) => {
            if (!item.is_bookmarked) e.currentTarget.style.color = C.text.muted
          }}
          title={item.is_bookmarked ? 'Remove from Library' : 'Save to Library'}
        >
          {item.is_bookmarked
            ? <><BookmarkMinus size={14} strokeWidth={2} /> Remove from Library</>
            : <><BookmarkPlus size={14} strokeWidth={2} /> Save to Library</>
          }
        </button>
      </div>
    </article>
  )
}

function ActionButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-md p-1.5"
      style={{ color: C.text.muted, background: 'none', border: 'none', cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
      onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
    >
      {children}
    </button>
  )
}
