import { LucideIcon } from 'lucide-react'
import { C, F, R } from '../../lib/tokens'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'outline'
  }
}

export default function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="mb-6">
        <Icon size={48} color={C.accent.red} strokeWidth={1.5} />
      </div>
      <h3
        style={{ fontFamily: F.display, fontSize: '18px', fontWeight: 600, color: C.text.primary, marginBottom: '8px' }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: F.body,
          fontSize: '14px',
          color: C.text.muted,
          maxWidth: '280px',
          lineHeight: 1.6,
          marginBottom: action ? '24px' : '0',
        }}
      >
        {subtitle}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 20px',
            borderRadius: R.input,
            backgroundColor: action.variant === 'outline' ? 'transparent' : C.accent.red,
            border: `1px solid ${C.accent.red}`,
            color: action.variant === 'outline' ? C.accent.red : '#FFFFFF',
            fontFamily: F.body,
            fontSize: '14px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
