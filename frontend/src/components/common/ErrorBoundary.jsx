import { Component } from 'react';

/**
 * Top-level error boundary.
 *
 * Without this, a single buggy component (e.g. a `null.foo` access in a card)
 * would crash React's reconciliation and silently leave the page on an old
 * `<Loading />` view — making the UI look like it's "loading forever" when
 * the real problem is a render-side exception.
 *
 * With this boundary:
 *  - Render crashes surface as visible UI (red error block) instead of
 *    a silent blank screen
 *  - The error + stack are logged to console AND shown to the user
 *  - User can click "Reload" to recover without a full browser refresh
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Clear error state and force a re-render
    this.setState({ error: null, errorInfo: null });
    // Also force a full page reload to recover any stuck state
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const message =
        this.state.error?.message ||
        (typeof this.state.error === 'string' ? this.state.error : 'Unknown render error');

      return (
        <div className="min-h-screen flex items-center justify-center bg-primary-900 p-6">
          <div className="max-w-2xl w-full bg-red-950/40 border border-red-700 rounded-xl p-6 text-primary-900">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-700/40 flex items-center justify-center text-red-300 font-bold">
                !
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-1">Something went wrong</h1>
                <p className="text-sm text-primary-700">
                  A component on this page crashed during render. The error has
                  been logged to the browser console.
                </p>
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-4 mb-4 border border-red-900/50">
              <div className="text-xs uppercase tracking-wider text-red-300 mb-2">
                Error
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap wrap-break-word text-red-200">
                {message}
              </pre>
              {this.state.errorInfo?.componentStack && (
                <details className="mt-3">
                  <summary className="text-xs cursor-pointer text-primary-700 hover:text-primary-900">
                    Component stack
                  </summary>
                  <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word text-primary-700 mt-2 max-h-64 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md font-medium text-sm"
              >
                Reload page
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-primary-800 hover:bg-primary-700 rounded-md font-medium text-sm"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
