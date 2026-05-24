import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--term-void)',
            color: 'var(--term-green)',
            fontFamily: 'var(--font-terminal)',
            padding: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div
              style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                opacity: 0.6,
                color: 'var(--term-red)',
              }}
            >
              !
            </div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--term-amber)',
                marginBottom: '2rem',
                fontFamily: 'var(--font-terminal)',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary"
              style={{
                fontSize: '0.875rem',
                padding: '0.75rem 2rem',
                cursor: 'pointer',
              }}
              aria-label="Reload"
            >
              [RELOAD]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
