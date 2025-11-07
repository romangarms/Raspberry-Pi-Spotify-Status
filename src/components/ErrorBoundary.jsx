import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Signal to DevMenu that an error occurred (makes button visible)
    window.__APP_HAS_ERROR__ = true

    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          fontFamily: 'sans-serif'
        }}>
          <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>
            Something went wrong
          </h1>

          <p style={{ marginBottom: '30px', maxWidth: '600px', fontSize: '18px', lineHeight: '1.6' }}>
            The app encountered an error and couldn't continue.
            <br /><br />
            <strong style={{ color: '#1db954' }}>Tip:</strong> Tap the red debug button in the
            lower-left corner to open the developer menu, where you can view console logs,
            reload the app, or access other debugging tools.
          </p>

          <button
            onClick={this.handleReload}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              backgroundColor: '#1db954',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}
          >
            Reload App
          </button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '20px',
              maxWidth: '800px',
              width: '100%',
              textAlign: 'left',
              backgroundColor: '#2a2a2a',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#f44336' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '12px',
                overflow: 'auto',
                color: '#fff'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
