import React from 'react';

interface Props {
  name: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class LazyErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-[var(--term-green)] bg-[var(--term-void)] border border-[var(--term-green-dim)] rounded">
          <p>Failed to load {this.props.name}</p>
          <button 
            onClick={() => this.setState({ hasError: false })} 
            className="mt-2 text-sm underline"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}