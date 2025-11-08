import { useState, useEffect, useRef } from 'react'
import { AUTO_REFRESH } from '../config/constants'
import { getGlobalMemoryMonitor } from '../utils/memoryMonitor'

/**
 * Hook for automatic page refresh based on memory usage
 * Prevents memory leaks by refreshing before browser crashes
 * Also ensures kiosk clients get server updates automatically
 *
 * @returns {Object} - { secondsRemaining, refreshReason }
 */
function useAutoRefresh() {
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [refreshReason, setRefreshReason] = useState('')
  const countdownIntervalRef = useRef(null)
  const memoryCheckIntervalRef = useRef(null)

  // Check memory usage periodically
  useEffect(() => {
    if (!AUTO_REFRESH.ENABLED) return

    const checkMemoryUsage = () => {
      const memoryMonitor = getGlobalMemoryMonitor()
      const memoryUsage = memoryMonitor.getMemoryUsage()

      const usagePercent = parseFloat(memoryUsage.percentage)
      const threshold = AUTO_REFRESH.MEMORY_THRESHOLD_PERCENT

      if (usagePercent >= threshold) {
        console.log(`Memory threshold exceeded: ${usagePercent}% >= ${threshold}%`)
        triggerRefresh(`Memory at ${usagePercent}%`)
      }
    }

    // Initial check
    checkMemoryUsage()

    // Periodic checks
    memoryCheckIntervalRef.current = setInterval(
      checkMemoryUsage,
      AUTO_REFRESH.CHECK_INTERVAL
    )

    return () => {
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current)
      }
    }
  }, [])

  const triggerRefresh = (reason) => {
    console.log(`Triggering refresh: ${reason}`)
    setRefreshReason(reason)
    setSecondsRemaining(AUTO_REFRESH.WARNING_SECONDS)

    // Start countdown
    let remaining = AUTO_REFRESH.WARNING_SECONDS

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1
      setSecondsRemaining(remaining)

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current)
        console.log('Refreshing page now...')
        window.location.reload()
      }
    }, 1000)
  }

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current)
      }
    }
  }, [])

  return {
    secondsRemaining,
    refreshReason
  }
}

export default useAutoRefresh
