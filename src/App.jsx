import React, { useState, useEffect, useRef } from 'react'
import CurrentlyPlaying from './components/CurrentlyPlaying'
import NotPlaying from './components/NotPlaying'
import useSpotifyPolling from './hooks/useSpotifyPolling'
import { API_RESPONSE_DELAY } from './config/constants'
import './styles/App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const ignoreAutoRefresh = useRef(false)
  const screenServerUrl = useRef(null)

  // Get screen server URL from environment
  useEffect(() => {
    // In production, this would come from Flask template
    // For development, we'll set it to null
    screenServerUrl.current = window.SCREEN_SERVER_URL || null
  }, [])

  // Polling hook for track updates
  const { forceRefresh } = useSpotifyPolling({
    currentTrack,
    setCurrentTrack,
    setIsPlaying,
    setIsLiked,
    setProgress,
    setDuration,
    ignoreAutoRefresh
  })

  const handlePlayPause = async () => {
    const endpoint = isPlaying ? '/api/pause' : '/api/play'
    
    try {
      const response = await fetch(endpoint, { credentials: 'same-origin' })
      
      // Check for authentication error
      if (response.status === 401) {
        window.location.href = '/'
        return
      }
      
      // Optimistic UI update
      setIsPlaying(!isPlaying)
      
      // Trigger refresh after Spotify API updates
      forceRefresh(API_RESPONSE_DELAY)
    } catch (error) {
      console.error('Unable to reach server:', error)
    }
  }

  const handleSkip = async () => {
    try {
      const response = await fetch('/api/skip', { credentials: 'same-origin' })
      
      // Check for authentication error
      if (response.status === 401) {
        window.location.href = '/'
        return
      }
      
      // Trigger refresh to get new track
      forceRefresh(API_RESPONSE_DELAY)
    } catch (error) {
      console.error('Unable to reach server:', error)
    }
  }

  const handleLikeToggle = async () => {
    const endpoint = isLiked ? `/api/unlike?id=${currentTrack?.id}` : `/api/like?id=${currentTrack?.id}`
    
    try {
      const response = await fetch(endpoint, { credentials: 'same-origin' })
      
      // Check for authentication error
      if (response.status === 401) {
        window.location.href = '/'
        return
      }
      
      // Optimistic UI update
      setIsLiked(!isLiked)
      
      // Trigger refresh to confirm like status
      forceRefresh(API_RESPONSE_DELAY)
    } catch (error) {
      console.error('Unable to reach server:', error)
    }
  }

  if (!isAuthenticated) {
    // Handle authentication redirect
    window.location.href = '/'
    return null
  }

  if (!currentTrack) {
    return <NotPlaying screenServerUrl={screenServerUrl.current} />
  }

  return (
    <CurrentlyPlaying
      track={currentTrack}
      isPlaying={isPlaying}
      isLiked={isLiked}
      progress={progress}
      duration={duration}
      onPlayPause={handlePlayPause}
      onSkip={handleSkip}
      onLikeToggle={handleLikeToggle}
      screenServerUrl={screenServerUrl.current}
    />
  )
}

export default App