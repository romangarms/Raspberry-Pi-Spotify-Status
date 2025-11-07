import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import DevMenu from './components/DevMenu.jsx'
import { getGlobalConsoleCapture } from './utils/consoleCapture'
import './styles/index.css'

// Start console capture as early as possible
const consoleCapture = getGlobalConsoleCapture()
consoleCapture.start()

// Global error handlers to catch uncaught errors and promise rejections
// These will now use the intercepted console.error
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
    <>
      <DevMenu />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </>
  </React.StrictMode>,
)