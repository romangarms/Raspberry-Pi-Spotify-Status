const MAX_LOGS = 100

// Shared console capture utility
// Can be used by both function components (via hook) and class components

export function createConsoleCapture() {
  const state = {
    logs: [],
    originalConsole: {
      log: console.log,
      error: console.error,
      warn: console.warn,
    },
    isCapturing: false,
    listeners: new Set(),
  }

  const notifyListeners = () => {
    state.listeners.forEach(listener => listener([...state.logs]))
  }

  const captureLog = (type, originalMethod) => (...args) => {
    // Call original method
    originalMethod.apply(console, args)

    // Don't capture if not started
    if (!state.isCapturing) return

    // Capture the log
    const timestamp = new Date().toLocaleTimeString()
    const message = args
      .map(arg => {
        // Special handling for Error objects (they don't JSON.stringify well)
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}\n${arg.stack || ''}`
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      })
      .join(' ')

    state.logs.push({ type, message, timestamp })

    // Keep only last MAX_LOGS entries
    if (state.logs.length > MAX_LOGS) {
      state.logs = state.logs.slice(-MAX_LOGS)
    }

    notifyListeners()
  }

  return {
    start() {
      if (state.isCapturing) return

      state.isCapturing = true
      console.log = captureLog('log', state.originalConsole.log)
      console.error = captureLog('error', state.originalConsole.error)
      console.warn = captureLog('warn', state.originalConsole.warn)
    },

    stop() {
      if (!state.isCapturing) return

      state.isCapturing = false
      console.log = state.originalConsole.log
      console.error = state.originalConsole.error
      console.warn = state.originalConsole.warn
    },

    getLogs() {
      return [...state.logs]
    },

    clearLogs() {
      state.logs = []
      notifyListeners()
    },

    subscribe(listener) {
      state.listeners.add(listener)
      // Immediately call with current logs
      listener([...state.logs])

      // Return unsubscribe function
      return () => {
        state.listeners.delete(listener)
      }
    },
  }
}

// Global singleton instance
let globalCapture = null

export function getGlobalConsoleCapture() {
  if (!globalCapture) {
    globalCapture = createConsoleCapture()
  }
  return globalCapture
}
