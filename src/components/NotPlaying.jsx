import { useEffect } from 'react'
import ScreenOffNotification from './ScreenOffNotification'
import useScreenControl from '../hooks/useScreenControl'
import '../styles/NotPlaying.css'

function NotPlaying({ screenServerUrl }) {
  // Use screen control hook with isPlaying=false to trigger countdown
  const screenOffCountdown = useScreenControl(false, screenServerUrl)

  useEffect(() => {
    // Reset body styles
    document.body.style.backgroundColor = ''
    document.body.style.color = ''
  }, [])

  return (
    <>
      <div id="outer">
        <div id="center">
          <h1 className="not-playing">Nothing is currently playing.</h1>
        </div>
      </div>
      <ScreenOffNotification secondsRemaining={screenOffCountdown} />
    </>
  )
}

export default NotPlaying