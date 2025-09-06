import { useEffect, useRef, useCallback } from 'react'
import { POLLING, API_RESPONSE_DELAY } from '../config/constants'

function useSpotifyPolling({
  currentTrack,
  setCurrentTrack,
  setIsPlaying,
  setIsLiked,
  setProgress,
  setDuration
}) {
  const intervalRef = useRef(null)
  const pollTrackInfoRef = useRef(null)
  
  const pollTrackInfo = useCallback(async (forceRefresh = false) => {
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
    } catch (error) {
      console.error('Error polling track info:', error)
    }
  }, [currentTrack?.id, setCurrentTrack, setIsPlaying, setIsLiked, setProgress, setDuration])

  // Store the latest pollTrackInfo in a ref so the interval always uses the current version
  useEffect(() => {
    pollTrackInfoRef.current = pollTrackInfo
  }, [pollTrackInfo])

  // Force refresh function to be called after user actions
  const forceRefresh = useCallback((delay = API_RESPONSE_DELAY) => {
    // Delay to allow Spotify API to update
    setTimeout(() => {
      if (pollTrackInfoRef.current) {
        pollTrackInfoRef.current(true)
      }
    }, delay)
  }, [])

  useEffect(() => {
    // Initial poll
    if (pollTrackInfoRef.current) {
      pollTrackInfoRef.current()
    }

    // Set up interval based on constant - use ref to avoid recreating interval
    intervalRef.current = setInterval(() => {
      if (pollTrackInfoRef.current) {
        pollTrackInfoRef.current()
      }
    }, POLLING.INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, []) // Empty dependency array - only set up interval once

  return { forceRefresh }
}

export default useSpotifyPolling