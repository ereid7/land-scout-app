'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: 24, color: '#ef4444' }}>
            <strong>Something went wrong</strong>
            <p style={{ fontSize: 12, opacity: 0.7 }}>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
