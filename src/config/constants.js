// Polling configuration
export const POLLING = {
  INTERVAL: 1000,  // 1 second polling interval (ms)
  PAUSE_AFTER_ACTION: 1500,  // Pause auto-polling after user action (ms)
  PAUSE_AFTER_SKIP: 1500,  // Pause after skip (same as other actions)
}

// API response delays (time for Spotify API to update)
export const API_DELAYS = {
  PLAY_PAUSE: 300,  // Delay before fetching after play/pause (ms)
  SKIP: 300,  // Delay before fetching after skip (ms)
  LIKE_UNLIKE: 300,  // Delay before fetching after like/unlike (ms)
}

// Progress bar animation
export const PROGRESS_BAR = {
  TRANSITION_DURATION: 1000,  // Match polling interval (ms)
  COLOR_TRANSITION: 300,  // Color change transition (ms)
}

// Text formatting limits (matches Flask backend)
export const TEXT_LIMITS = {
  TITLE_MAX: 25,
  ARTIST_MAX: 35,
  ALBUM_MAX: 20,
}

// Screen server configuration
export const SCREEN_SERVER = {
  TURN_ON_ENDPOINT: '/TurnOnScreen',
  TURN_OFF_ENDPOINT: '/TurnOffScreen',
}