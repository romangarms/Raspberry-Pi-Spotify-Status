import { useState, useEffect, useRef } from 'react'
import { getGlobalMemoryMonitor } from '../utils/memoryMonitor'

/**
 * Hook for tracking memory usage in React components
 * Takes automatic snapshots at regular intervals
 *
 * @param {number} intervalSeconds - How often to take snapshots (default: 60 seconds)
 * @returns {Object} Memory tracking data and controls
 */
function useMemoryTracking(intervalSeconds = 60) {
  const [, forceUpdate] = useState({})
  const monitorRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    // Get the global memory monitor instance
    monitorRef.current = getGlobalMemoryMonitor()

    // Take initial snapshot
    monitorRef.current.takeSnapshot()

    // Subscribe to updates
    const unsubscribe = monitorRef.current.subscribe(() => {
      // Force re-render when monitor updates
      forceUpdate({})
    })

    // Set up automatic snapshot interval
    intervalRef.current = setInterval(() => {
      monitorRef.current.takeSnapshot()
    }, intervalSeconds * 1000)

    // Cleanup
    return () => {
      unsubscribe()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [intervalSeconds])

  // Return current state and controls
  return {
    // Current snapshot
    currentSnapshot: monitorRef.current?.getLatestSnapshot(),

    // All snapshots
    snapshots: monitorRef.current?.getSnapshots() || [],

    // Memory usage
    memoryUsage: monitorRef.current?.getMemoryUsage(),

    // Growth rate (MB/hour)
    growthRate: monitorRef.current?.getMemoryGrowthRate() || 0,

    // Health status
    healthStatus: monitorRef.current?.getHealthStatus() || { status: 'unknown', message: '', color: 'gray' },

    // Check for leak
    hasLeak: monitorRef.current?.hasMemoryLeak() || false,

    // DOM node count
    domNodeCount: monitorRef.current?.getDOMNodeCount() || 0,

    // Event listener count
    eventListenerCount: monitorRef.current?.eventListenerCount || 0,

    // Timer counts
    intervalCount: monitorRef.current?.intervalTimerCount || 0,
    timeoutCount: monitorRef.current?.timeoutTimerCount || 0,

    // Uptime
    uptime: monitorRef.current?.getUptime() || 0,

    // Actions
    takeSnapshot: () => monitorRef.current?.takeSnapshot(),
    exportReport: () => monitorRef.current?.exportReport(),
    downloadReport: () => monitorRef.current?.downloadReport(),
    reset: () => monitorRef.current?.reset()
  }
}

export default useMemoryTracking
