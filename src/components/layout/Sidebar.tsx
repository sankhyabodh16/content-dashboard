import { NavLink } from 'react-router-dom'
import { Rss, Users, BookMarked, Sparkles, Settings, type LucideIcon } from 'lucide-react'
import { C, F } from '../../lib/tokens'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

const navSections: { header: string; items: NavItem[] }[] = [
  {
    header: 'RESEARCH',
    items: [
      { label: 'Creator List', path: '/creators', icon: Users },
      { label: 'Feed', path: '/', icon: Rss },
      { label: 'Library', path: '/library', icon: BookMarked },
    ],
  },
  {
    header: 'AI STUDIO',
    items: [{ label: 'Content Ideas', path: '/ideas', icon: Sparkles }],
  },
]

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col"
      style={{ width: '240px', backgroundColor: C.bg.sidebar, borderRight: `1px solid ${C.border.default}`, zIndex: 50 }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border.default}` }}>
        <div
          className="flex items-center justify-center rounded-md flex-shrink-0"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: C.accent.red,
            fontSize: '11px',
            fontFamily: F.display,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
          }}
        >
          100
        </div>
        <div className="flex flex-col">
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: '15px', color: C.text.primary, lineHeight: 1.2 }}>
            100 OPS
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontWeight: 400,
              fontSize: '10px',
              color: C.text.muted,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            CONTENT BASE
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section) => (
          <div key={section.header} className="mb-6">
            <div
              className="px-3 mb-2"
              style={{
                fontFamily: F.mono,
                fontSize: '11px',
                color: C.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {section.header}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className="flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5"
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'rgba(232,50,50,0.08)' : 'transparent',
                  color: isActive ? C.accent.red : C.text.secondary,
                  borderLeft: isActive ? `3px solid ${C.accent.red}` : '3px solid transparent',
                  fontFamily: F.body,
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: 'none',
                })}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  const isActive = el.getAttribute('aria-current') === 'page'
                  if (!isActive) {
                    el.style.backgroundColor = 'rgba(255,255,255,0.04)'
                    el.style.color = C.text.primary
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  const isActive = el.getAttribute('aria-current') === 'page'
                  if (!isActive) {
                    el.style.backgroundColor = 'transparent'
                    el.style.color = C.text.secondary
                  }
                }}
              >
                <item.icon size={16} strokeWidth={1.8} />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom user */}
      <div className="px-4 py-4 flex items-center gap-3" style={{ borderTop: `1px solid ${C.border.default}` }}>
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: '32px', height: '32px', backgroundColor: C.accent.red, color: '#FFFFFF', fontSize: '13px', fontFamily: F.display, fontWeight: 600 }}
        >
          S
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: F.body, fontSize: '14px', color: C.text.primary, lineHeight: 1.3 }}>Sankhya</div>
          <div style={{ fontFamily: F.mono, fontSize: '11px', color: C.text.muted, lineHeight: 1.3 }}>Admin</div>
        </div>
        <button
          className="flex items-center justify-center rounded-lg p-1.5"
          style={{ color: C.text.muted, background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.text.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.text.muted)}
        >
          <Settings size={15} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  )
}
