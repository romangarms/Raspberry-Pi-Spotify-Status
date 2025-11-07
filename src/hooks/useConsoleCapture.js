import { useEffect, useState } from 'react'
import { getGlobalConsoleCapture } from '../utils/consoleCapture'

export default function useConsoleCapture() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const capture = getGlobalConsoleCapture()

    // Start capturing if not already started
    capture.start()

    // Subscribe to log updates
    const unsubscribe = capture.subscribe(setLogs)

    // Cleanup: unsubscribe (but don't stop capture, other components may be using it)
    return unsubscribe
  }, [])

  const clearLogs = () => {
    const capture = getGlobalConsoleCapture()
    capture.clearLogs()
  }

  return { logs, clearLogs }
}
