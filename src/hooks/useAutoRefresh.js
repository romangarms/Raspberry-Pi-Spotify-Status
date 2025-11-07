import { useState, useEffect, useRef } from 'react'
import { AUTO_REFRESH } from '../config/constants'
import { getGlobalMemoryMonitor } from '../utils/memoryMonitor'

/**
 * Hook for automatic page refresh based on memory usage or track count
 * Prevents memory leaks by refreshing before browser crashes
 * Also ensures kiosk clients get server updates automatically
 *
 * @param {Object} currentTrack - Current track object (to detect track changes)
 * @returns {Object} - { secondsRemaining, refreshReason }
 */
function useAutoRefresh(currentTrack) {
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [refreshReason, setRefreshReason] = useState('')
  const lastTrackIdRef = useRef(null)
  const trackCountRef = useRef(0)
  const countdownIntervalRef = useRef(null)
  const memoryCheckIntervalRef = useRef(null)

  // Track number of tracks played (fallback mechanism)
  useEffect(() => {
    if (!AUTO_REFRESH.ENABLED) return

    if (currentTrack?.id && currentTrack.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = currentTrack.id
      trackCountRef.current += 1

      console.log(`Track count: ${trackCountRef.current}/${AUTO_REFRESH.TRACK_FALLBACK_COUNT}`)

      // Fallback: Check if track count exceeded (only if memory API unavailable)
      const memoryMonitor = getGlobalMemoryMonitor()
      const memoryUsage = memoryMonitor.getMemoryUsage()

      if (!memoryUsage && trackCountRef.current >= AUTO_REFRESH.TRACK_FALLBACK_COUNT) {
        console.log('Track count threshold reached (memory API unavailable)')
        triggerRefresh('Track limit reached')
      }
    }
  }, [currentTrack?.id])

  // Check memory usage periodically
  useEffect(() => {
    if (!AUTO_REFRESH.ENABLED) return

    const checkMemoryUsage = () => {
      const memoryMonitor = getGlobalMemoryMonitor()
      const memoryUsage = memoryMonitor.getMemoryUsage()

      if (!memoryUsage) {
        console.log('Memory API not available, using track-based fallback')
        return
      }

      const usagePercent = parseFloat(memoryUsage.percentage)
      const threshold = AUTO_REFRESH.MEMORY_THRESHOLD_PERCENT

      console.log(`Memory usage: ${usagePercent}% (threshold: ${threshold}%)`)

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
