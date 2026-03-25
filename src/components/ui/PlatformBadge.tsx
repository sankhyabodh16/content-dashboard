import { Platform } from '../../types'
import { PLATFORM_COLORS } from '../../lib/tokens'

interface PlatformBadgeProps {
  platform: Platform
  size?: 'sm' | 'md'
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
}

export default function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const color = PLATFORM_COLORS[platform] ?? '#666666'
  const label = PLATFORM_LABELS[platform] ?? platform

  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: size === 'sm' ? '11px' : '12px',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        color,
        backgroundColor: `${color}1A`,
        borderRadius: '9999px',
        letterSpacing: '0.05em',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  )
}
