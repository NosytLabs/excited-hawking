import React from 'react';

interface LazyErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class LazyErrorBoundary extends React.Component<LazyErrorBoundaryProps, LazyErrorBoundaryState> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LazyErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--paper-deep)',
            border: '1px solid var(--paper-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '1rem',
                opacity: 0.6,
                color: 'var(--danger)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              !
            </div>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper-text)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Failed to load component
            </h2>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--paper-muted)',
                marginBottom: '1.5rem',
                fontFamily: 'var(--font-mono)',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--paper-void)',
                border: '1px solid var(--accent-primary)',
                padding: '0.5rem 1.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
              aria-label="Retry loading component"
            >
              [RETRY]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}