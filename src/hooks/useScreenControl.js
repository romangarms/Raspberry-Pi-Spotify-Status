import { useEffect, useRef, useState } from 'react'
import { SCREEN_SERVER } from '../config/constants'

function useScreenControl(isPlaying, screenServerUrl) {
  const [screenOffCountdown, setScreenOffCountdown] = useState(0)
  const screenOffTimeoutRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  useEffect(() => {
    if (!screenServerUrl) return

    // Clear any existing timers
    if (screenOffTimeoutRef.current) {
      clearTimeout(screenOffTimeoutRef.current)
      screenOffTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    if (isPlaying) {
      // Music is playing - turn on screen immediately and clear countdown
      setScreenOffCountdown(0)
      fetch(`${screenServerUrl}${SCREEN_SERVER.TURN_ON_ENDPOINT}`).catch(() => {
        console.log('Screen server not reachable')
      })
    } else {
      // Music paused - start countdown to turn off screen
      const countdownSeconds = Math.floor(SCREEN_SERVER.TURN_OFF_DELAY / 1000)
      setScreenOffCountdown(countdownSeconds)

      // Update countdown every second
      countdownIntervalRef.current = setInterval(() => {
        setScreenOffCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Set timeout to turn off screen after delay
      screenOffTimeoutRef.current = setTimeout(() => {
        fetch(`${screenServerUrl}${SCREEN_SERVER.TURN_OFF_ENDPOINT}`).catch(() => {
          console.log('Screen server not reachable')
        })
        setScreenOffCountdown(0)
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }, SCREEN_SERVER.TURN_OFF_DELAY)
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (screenOffTimeoutRef.current) {
        clearTimeout(screenOffTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [isPlaying, screenServerUrl])

  return screenOffCountdown
}

export default useScreenControl