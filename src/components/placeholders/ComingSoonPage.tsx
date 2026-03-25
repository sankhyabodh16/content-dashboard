import { Sparkles, Megaphone, FileText, BarChart3, LucideIcon } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { C, F } from '../../lib/tokens'
import EmptyState from '../ui/EmptyState'

interface PageConfig {
  icon: LucideIcon
  title: string
  subtitle: string
  showNotify?: boolean
}

const PAGE_CONFIG: Record<string, PageConfig> = {
  '/content-studio': {
    icon: Sparkles,
    title: 'Content Studio',
    subtitle: 'AI-powered content creation across all platforms. Transform your ideas into polished posts in seconds.',
    showNotify: true,
  },
  '/brand-voice': {
    icon: Megaphone,
    title: 'Brand Voice',
    subtitle: 'Define and enforce your unique brand voice across every piece of content you create.',
  },
  '/saved-drafts': {
    icon: FileText,
    title: 'Saved Drafts',
    subtitle: 'All your work-in-progress content in one place. Pick up right where you left off.',
  },
  '/performance': {
    icon: BarChart3,
    title: 'Performance',
    subtitle: 'Deep analytics across every platform. Understand what content resonates and why.',
  },
}

export default function ComingSoonPage() {
  const { pathname } = useLocation()
  const config = PAGE_CONFIG[pathname] ?? {
    icon: Sparkles,
    title: 'Coming Soon',
    subtitle: 'This feature is under construction.',
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg.base }}>
      {/* Top bar */}
      <div
        className="flex items-center px-10 py-6 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border.default}` }}
      >
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 700, color: C.text.primary, lineHeight: 1.2 }}>
            {config.title}
          </h1>
          <p style={{ fontFamily: F.body, fontSize: '14px', color: C.text.muted, marginTop: '2px' }}>
            This feature is currently in development
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={config.icon}
          title={`${config.title} is coming soon`}
          subtitle={config.subtitle}
          action={
            config.showNotify
              ? { label: 'Notify me when ready', onClick: () => {}, variant: 'outline' }
              : undefined
          }
        />
      </div>
    </div>
  )
}
