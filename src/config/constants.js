// Polling configuration
export const POLLING = {
  INTERVAL: 2000,  // 2 second polling interval (ms)
}

// Progress bar animation
export const PROGRESS_BAR = {
  TRANSITION_DURATION: 2000,  // Match polling interval (ms)
  COLOR_TRANSITION: 300,  // Color change transition (ms)
}

// Screen server endpoints
export const SCREEN_SERVER = {
  TURN_ON_ENDPOINT: '/TurnOnScreen',
  TURN_OFF_ENDPOINT: '/TurnOffScreen',
  TURN_OFF_DELAY: 30000,  // 30 seconds delay before turning off screen (ms)
}

// Auto-refresh configuration
export const AUTO_REFRESH = {
  ENABLED: true,  // Enable automatic page refresh to prevent memory leaks
  MEMORY_THRESHOLD_PERCENT: 50,  // Refresh when memory usage exceeds this % of heap limit
  TRACK_FALLBACK_COUNT: 20,  // Fallback: refresh after this many tracks if memory API unavailable
  WARNING_SECONDS: 5,  // Show countdown warning for this many seconds before refresh
  CHECK_INTERVAL: 60000,  // Check memory usage every 60 seconds (ms)
}