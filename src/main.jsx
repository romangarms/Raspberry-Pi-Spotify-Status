import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/index.css'

// Global error handlers to catch uncaught errors and promise rejections
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Uncaught error:', {
    message,
    source,
    lineno,
    colno,
    error
  })
  // Return false to allow default error handling
  return false
}

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Prevent default browser error handling
  event.preventDefault()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)