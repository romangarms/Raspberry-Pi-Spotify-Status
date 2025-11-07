import { useEffect, useState } from 'react'
import '../styles/ScreenOffNotification.css'

function RefreshWarning({ secondsRemaining, reason }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (secondsRemaining > 0) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [secondsRemaining])

  if (!visible) return null

  return (
    <div className="screen-off-notification">
      <div className="notification-content">
        <span className="notification-icon">🔄</span>
        <span className="notification-text">
          {reason || 'Memory limit reached'} - Refreshing in {secondsRemaining}s
        </span>
      </div>
    </div>
  )
}

export default RefreshWarning
