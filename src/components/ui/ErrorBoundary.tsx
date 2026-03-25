import { Component, ReactNode } from 'react'
import { C, F, R } from '../../lib/tokens'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center"
          style={{ minHeight: '100vh', backgroundColor: C.bg.base, padding: '40px' }}
        >
          <div
            style={{
              backgroundColor: C.bg.surface,
              border: `1px solid ${C.border.default}`,
              borderRadius: R.card,
              padding: '40px',
              maxWidth: '480px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: F.mono, fontSize: '11px', color: C.accent.red, letterSpacing: '0.1em', marginBottom: '12px' }}>
              RUNTIME ERROR
            </p>
            <h2 style={{ fontFamily: F.display, fontSize: '20px', fontWeight: 700, color: C.text.primary, marginBottom: '8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontFamily: F.mono, fontSize: '12px', color: C.text.muted, marginBottom: '24px', lineHeight: 1.6 }}>
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: C.accent.red,
                color: '#fff',
                border: 'none',
                borderRadius: R.input,
                padding: '10px 24px',
                fontFamily: F.body,
                fontSize: '14px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
