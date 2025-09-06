import { useEffect, useRef, useCallback } from 'react'
import { POLLING, API_DELAYS } from '../config/constants'

function useSpotifyPolling({
  currentTrack,
  setCurrentTrack,
  setIsPlaying,
  setIsLiked,
  setProgress,
  setDuration,
  screenServerUrl
}) {
  const intervalRef = useRef(null)
  const pausedUntilRef = useRef(null)
  
  const pollTrackInfo = useCallback(async (forceRefresh = false) => {
    // Skip auto-polling if paused
    if (!forceRefresh && pausedUntilRef.current && Date.now() < pausedUntilRef.current) {
      return
    }

    try {
      const params = new URLSearchParams({
        id: currentTrack?.id || '',
        currently_playing: currentTrack ? 'True' : 'False'
      })

      const response = await fetch(`/api/current_track_xhr?${params}`, {
        credentials: 'same-origin'
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, redirect to login
          window.location.href = '/'
          return
        }
        throw new Error('Failed to fetch track info')
      }

      const data = await response.json()

      // Update playback state
      setProgress(data.progress || 0)
      setDuration(data.duration || 0)
      setIsPlaying(data.currently_playing)
      setIsLiked(data.liked)

      // Check if track has changed
      if (!data.same_track || forceRefresh) {
        // Fetch full track info from Flask endpoint
        try {
          const trackResponse = await fetch('/api/currently_playing', {
            headers: {
              'Accept': 'application/json'
            },
            credentials: 'same-origin'
          })
          
          if (!trackResponse.ok) {
            if (trackResponse.status === 401) {
              // Not authenticated, redirect to login
              window.location.href = '/'
              return
            }
            throw new Error('Failed to fetch track details')
          }
          
          const trackData = await trackResponse.json()
          
          if (trackData.track) {
            setCurrentTrack({
              id: trackData.song_id,
              title: trackData.title,
              artist: trackData.artist,
              album: trackData.album,
              year: trackData.year,
              artUrl: trackData.art_url,
              isPlaying: trackData.currently_playing
            })
          } else {
            // No track playing
            setCurrentTrack(null)
          }
        } catch (error) {
          console.error('Error fetching track details:', error)
        }
      }

      // Handle screen server
      if (screenServerUrl) {
        const endpoint = data.currently_playing ? '/TurnOnScreen' : '/TurnOffScreen'
        fetch(`${screenServerUrl}${endpoint}`).catch(() => {
          console.log('Screen server not reachable')
        })
      }
    } catch (error) {
      console.error('Error polling track info:', error)
    }
  }, [currentTrack?.id, setCurrentTrack, setIsPlaying, setIsLiked, setProgress, setDuration, screenServerUrl])

  // Pause polling for a specified duration (in milliseconds)
  const pausePolling = useCallback((duration = POLLING.PAUSE_AFTER_ACTION) => {
    pausedUntilRef.current = Date.now() + duration
  }, [])

  // Force refresh function to be called after user actions
  const forceRefresh = useCallback((delay = API_DELAYS.PLAY_PAUSE) => {
    // Delay to allow Spotify API to update
    setTimeout(() => {
      pollTrackInfo(true)
    }, delay)
  }, [pollTrackInfo])

  useEffect(() => {
    // Initial poll
    pollTrackInfo()

    // Set up interval based on constant
    intervalRef.current = setInterval(() => pollTrackInfo(), POLLING.INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [pollTrackInfo])

  return { forceRefresh, pausePolling }
}

export default useSpotifyPolling