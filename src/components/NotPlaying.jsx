import React, { useEffect } from 'react'
import '../styles/NotPlaying.css'

function NotPlaying({ screenServerUrl }) {
  useEffect(() => {
    // Turn off screen when nothing is playing
    if (screenServerUrl) {
      fetch(`${screenServerUrl}/TurnOffScreen`).catch(() => {
        console.log('Screen server not reachable')
      })
    }

    // Reset body styles
    document.body.style.backgroundColor = ''
    document.body.style.color = ''
  }, [screenServerUrl])

  return (
    <div id="outer">
      <div id="center">
        <h1 className="not-playing">Nothing is currently playing.</h1>
      </div>
    </div>
  )
}

export default NotPlaying