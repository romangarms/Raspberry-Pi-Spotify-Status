// Polling configuration
export const POLLING = {
  INTERVAL: 1000,  // 1 second polling interval (ms)
}

// Spotify API response delay - time to wait for API to update after actions
export const API_RESPONSE_DELAY = 300  // milliseconds

// Progress bar animation
export const PROGRESS_BAR = {
  TRANSITION_DURATION: 1000,  // Match polling interval (ms)
  COLOR_TRANSITION: 300,  // Color change transition (ms)
}

// Screen server endpoints
export const SCREEN_SERVER = {
  TURN_ON_ENDPOINT: '/TurnOnScreen',
  TURN_OFF_ENDPOINT: '/TurnOffScreen',
}