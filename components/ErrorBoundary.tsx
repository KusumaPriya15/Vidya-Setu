import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to activity log if available
    try {
      import('../lib/activityLog').then(({ logActivity }) => {
        logActivity('error', 'Application Error', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p style={{ color: 'var(--text-secondary)' }}>
                We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
              </p>
              
              {this.state.error && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="font-mono text-sm text-red-600">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <summary className="cursor-pointer font-medium mb-2">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64" style={{ color: 'var(--text-secondary)' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset}>
                  Return to Home
                </Button>
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
