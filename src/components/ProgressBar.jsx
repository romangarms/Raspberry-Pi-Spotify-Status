import { useEffect, useRef } from 'react'
import { PROGRESS_BAR } from '../config/constants'

function ProgressBar({ progress, duration, backgroundColor, textColor }) {
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0
  const previousPercentageRef = useRef(progressPercentage)
  
  // Only animate if progress is moving forward
  const shouldAnimate = progressPercentage >= previousPercentageRef.current
  
  useEffect(() => {
    previousPercentageRef.current = progressPercentage
  }, [progressPercentage])

  const barStyle = {
    backgroundColor: `rgb(${backgroundColor.join(',')})`,
  }

  const innerBarStyle = {
    width: `${Math.min(progressPercentage, 101)}%`,
    backgroundColor: `rgb(${textColor.join(',')})`,
    transition: shouldAnimate 
      ? `width ${PROGRESS_BAR.TRANSITION_DURATION}ms linear, background-color ${PROGRESS_BAR.COLOR_TRANSITION}ms ease`
      : `background-color ${PROGRESS_BAR.COLOR_TRANSITION}ms ease`,
    boxShadow: '0px -2px 25px 5px rgba(0, 0, 0, 0.5)'
  }

  return (
    <div id="progress-bar" style={barStyle}>
      <div id="progress-bar-inner" style={innerBarStyle}></div>
    </div>
  )
}

export default ProgressBar