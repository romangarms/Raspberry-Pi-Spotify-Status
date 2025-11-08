import { useEffect, useRef, useState } from 'react'
import ColorThief from 'colorthief'
import MediaControls from './MediaControls'
import ProgressBar from './ProgressBar'
import ScreenOffNotification from './ScreenOffNotification'
import useScreenControl from '../hooks/useScreenControl'
import '../styles/CurrentlyPlaying.css'

function CurrentlyPlaying({
  track,
  isPlaying,
  isLiked,
  progress,
  duration,
  onPlayPause,
  onSkip,
  onLikeToggle,
  screenServerUrl
}) {
  const [backgroundColor, setBackgroundColor] = useState([255, 255, 255])
  const [textColor, setTextColor] = useState([0, 0, 0])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTrack, setDisplayTrack] = useState(track)
  const [cacheBustVersion, setCacheBustVersion] = useState(0)
  const imgRef = useRef(null)
  const lastTrackIdRef = useRef(track?.id)
  const appStartTimeRef = useRef(Date.now())
  
  // Use the screen control hook
  const screenOffCountdown = useScreenControl(isPlaying, screenServerUrl)

  // Periodically bust image cache to prevent memory accumulation
  useEffect(() => {
    const CACHE_BUST_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

    const interval = setInterval(() => {
      const uptime = Date.now() - appStartTimeRef.current
      console.log(`Cache bust triggered after ${Math.floor(uptime / 60000)} minutes uptime`)
      setCacheBustVersion(prev => prev + 1)
    }, CACHE_BUST_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  // Handle track changes with fade transition
  useEffect(() => {
    if (track?.id !== lastTrackIdRef.current && lastTrackIdRef.current !== undefined) {
      // Track has changed (not initial load), start transition
      setIsTransitioning(true)
      
      // After fade out, update the displayed track
      setTimeout(() => {
        setDisplayTrack(track)
        lastTrackIdRef.current = track?.id
        
        // Fade back in
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }, 300) // Half of the CSS transition duration
    } else if (lastTrackIdRef.current === undefined) {
      // Initial load, no transition
      setDisplayTrack(track)
      lastTrackIdRef.current = track?.id
    }
  }, [track])

  useEffect(() => {
    const extractColors = () => {
      if (!imgRef.current || !imgRef.current.complete) return

      try {
        const img = imgRef.current
        // Create a new ColorThief instance each time and let it be garbage collected
        // This should allow better cleanup than reusing a single instance
        const colorThief = new ColorThief()

        // Get dominant color for background
        const bgColor = colorThief.getColor(img)
        setBackgroundColor(bgColor)

        // Get palette for text color selection
        const palette = colorThief.getPalette(img, 8)

        // Calculate average brightness
        const avg = (color) => (color[0] + color[1] + color[2]) / 3
        const bgAvg = avg(bgColor)

        // Find most contrasting color from palette
        let bestTextColor = palette[0]
        let maxContrast = 0

        for (const color of palette) {
          const contrast = Math.abs(avg(color) - bgAvg)
          if (contrast > maxContrast) {
            maxContrast = contrast
            bestTextColor = color
          }
        }

        // If contrast is too low, use black or white
        if (maxContrast < 50) {
          console.log('Low contrast detected, using black/white')
          bestTextColor = bgAvg > 128 ? [0, 0, 0] : [255, 255, 255]
        }

        setTextColor(bestTextColor)
      } catch (error) {
        console.error('Error extracting colors:', error)
        // Fall back to default colors on error
        setBackgroundColor([255, 255, 255])
        setTextColor([0, 0, 0])
      }
    }

    const handleImageError = () => {
      console.error('Error loading album artwork')
      // Fall back to default colors on image load failure
      setBackgroundColor([255, 255, 255])
      setTextColor([0, 0, 0])
    }

    const imgElement = imgRef.current

    if (imgElement) {
      if (imgElement.complete) {
        extractColors()
      } else {
        // Use addEventListener with { once: true } to auto-remove after firing
        // This prevents event listener accumulation and memory leaks
        imgElement.addEventListener('load', extractColors, { once: true })
        imgElement.addEventListener('error', handleImageError, { once: true })
      }
    }

    // Cleanup function to remove event listeners if component unmounts
    // or if displayTrack changes before image loads
    return () => {
      if (imgElement) {
        imgElement.removeEventListener('load', extractColors)
        imgElement.removeEventListener('error', handleImageError)
      }
    }
  }, [displayTrack?.artUrl])

  // Apply colors to body and save to sessionStorage for seamless page refreshes
  useEffect(() => {
    const bgColorString = `rgb(${backgroundColor.join(',')})`
    const textColorString = `rgb(${textColor.join(',')})`

    document.body.style.backgroundColor = bgColorString
    document.body.style.color = textColorString

    // Save colors to sessionStorage to prevent white flash on page refresh
    sessionStorage.setItem('spotify-bg-color', bgColorString)
    sessionStorage.setItem('spotify-text-color', textColorString)

    return () => {
      document.body.style.backgroundColor = ''
      document.body.style.color = ''
    }
  }, [backgroundColor, textColor])

  return (
    <>
      <ScreenOffNotification secondsRemaining={screenOffCountdown} />
      <div id="outer" className={isTransitioning ? 'transitioning' : ''}>
        <div id="left">
          <img
            ref={imgRef}
            src={`${displayTrack.artUrl}${cacheBustVersion > 0 ? `?v=${cacheBustVersion}` : ''}`}
            crossOrigin="anonymous"
            id="album-art"
            alt="Album Art"
            className={isTransitioning ? 'fade-out' : 'fade-in'}
          />
        </div>
        <div id="right">
          <div id="text-outer">
            <div id="text" className={isTransitioning ? 'fade-out' : 'fade-in'}>
              <h1 className="title">{displayTrack.title}</h1>
              <h2 className="artist">{displayTrack.artist}</h2>
              <h2 className="album">
                {displayTrack.album} {displayTrack.year && `(${displayTrack.year})`}
              </h2>
            </div>
          </div>
          <MediaControls
            isPlaying={isPlaying}
            isLiked={isLiked}
            onPlayPause={onPlayPause}
            onSkip={onSkip}
            onLikeToggle={onLikeToggle}
            textColor={textColor}
          />
        </div>
      </div>
      <ProgressBar
        progress={progress}
        duration={duration}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
    </>
  )
}

export default CurrentlyPlaying