'use client'
import React, { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '1.5rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>⚠️ Oops!</h1>
              <p style={{ color: '#a1a1a1', fontSize: '0.875rem', marginTop: '0.5rem' }}>Algo salió mal. Por favor recarga la página.</p>
            </div>
            
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ color: '#fca5a5', fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {this.state.error?.message || 'Error desconocido'}
              </p>
            </div>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#00E5FF', color: 'black', border: 'none', borderRadius: '0.75rem', fontWeight: 900, fontSize: '0.875rem', textTransform: 'uppercase', cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#00D4EE')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#00E5FF')}
            >
              Recargar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}