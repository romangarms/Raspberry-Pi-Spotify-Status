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