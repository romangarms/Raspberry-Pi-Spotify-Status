import { useEffect, useRef, useState } from 'react'
import { PROGRESS_BAR } from '../config/constants'

function ProgressBar({ progress, duration, backgroundColor, textColor }) {
  const targetPercentage = duration > 0 ? (progress / duration) * 100 : 0
  const [displayedPercentage, setDisplayedPercentage] = useState(0)
  const animationFrameRef = useRef()
  const previousTargetRef = useRef(targetPercentage)
  const lastTrackDurationRef = useRef(duration)
  
  useEffect(() => {
    // Detect track change or seek backward (any backward movement)
    const progressWentBackward = targetPercentage < previousTargetRef.current
    
    if (progressWentBackward) {
      // Progress went backward - immediately jump to new position
      setDisplayedPercentage(targetPercentage)
      previousTargetRef.current = targetPercentage
      lastTrackDurationRef.current = duration
      return
    }
    
    // Cancel any existing animation before starting new one
    // This prevents RAF accumulation during rapid track changes
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Normal playback - animate smoothly
    const animate = () => {
      setDisplayedPercentage(current => {
        const diff = targetPercentage - current

        // If we're very close, just set it exactly
        if (Math.abs(diff) < 0.1) {
          previousTargetRef.current = targetPercentage
          return targetPercentage
        }

        // Calculate animation speed to reach target before next update
        // We want to reach the target in about 1 second (matching polling interval)
        const animationSpeed = diff / 60 // Assuming 60fps

        return current + animationSpeed
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate)
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [targetPercentage, duration])
  
  useEffect(() => {
    // Update refs when target changes
    previousTargetRef.current = targetPercentage
    lastTrackDurationRef.current = duration
  }, [targetPercentage, duration])

  const barStyle = {
    backgroundColor: `rgb(${backgroundColor.join(',')})`,
  }

  const innerBarStyle = {
    width: `${Math.min(displayedPercentage, 101)}%`,
    backgroundColor: `rgb(${textColor.join(',')})`,
    transition: `background-color ${PROGRESS_BAR.COLOR_TRANSITION}ms ease`,
    boxShadow: '0px -2px 25px 5px rgba(0, 0, 0, 0.5)'
  }

  return (
    <div id="progress-bar" style={barStyle}>
      <div id="progress-bar-inner" style={innerBarStyle}></div>
    </div>
  )
}

export default ProgressBar