/**
 * Memory monitoring utility for tracking memory usage and detecting leaks
 * Particularly useful for kiosk mode where DevTools aren't accessible
 */

class MemoryMonitor {
  constructor() {
    this.snapshots = []
    this.maxSnapshots = 30 // Keep last 30 minutes of data (reduced from 60 to save memory)
    this.listeners = new Set()
    this.eventListenerCount = 0
    this.intervalTimerCount = 0
    this.timeoutTimerCount = 0
    this.startTime = Date.now()

    // Monkey-patch addEventListener/removeEventListener to track counts
    this.setupEventListenerTracking()

    // Monkey-patch setInterval/setTimeout to track counts
    this.setupTimerTracking()
  }

  setupEventListenerTracking() {
    const originalAddEventListener = EventTarget.prototype.addEventListener
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener
    const self = this

    EventTarget.prototype.addEventListener = function(...args) {
      self.eventListenerCount++
      self.notifyListeners()
      return originalAddEventListener.apply(this, args)
    }

    EventTarget.prototype.removeEventListener = function(...args) {
      self.eventListenerCount = Math.max(0, self.eventListenerCount - 1)
      self.notifyListeners()
      return originalRemoveEventListener.apply(this, args)
    }
  }

  setupTimerTracking() {
    const originalSetInterval = window.setInterval
    const originalClearInterval = window.clearInterval
    const originalSetTimeout = window.setTimeout
    const originalClearTimeout = window.clearTimeout
    const self = this

    window.setInterval = function(...args) {
      self.intervalTimerCount++
      self.notifyListeners()
      return originalSetInterval.apply(this, args)
    }

    window.clearInterval = function(...args) {
      self.intervalTimerCount = Math.max(0, self.intervalTimerCount - 1)
      self.notifyListeners()
      return originalClearInterval.apply(this, args)
    }

    window.setTimeout = function(...args) {
      self.timeoutTimerCount++
      self.notifyListeners()
      return originalSetTimeout.apply(this, args)
    }

    window.clearTimeout = function(...args) {
      self.timeoutTimerCount = Math.max(0, self.timeoutTimerCount - 1)
      self.notifyListeners()
      return originalClearTimeout.apply(this, args)
    }
  }

  /**
   * Take a snapshot of current memory and performance metrics
   */
  takeSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      memory: this.getMemoryUsage(),
      domNodes: this.getDOMNodeCount(),
      eventListeners: this.eventListenerCount,
      intervals: this.intervalTimerCount,
      timeouts: this.timeoutTimerCount,
      uptime: this.getUptime()
    }

    this.snapshots.push(snapshot)

    // Keep only the most recent snapshots - shift oldest to avoid creating new arrays
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    this.notifyListeners()
    return snapshot
  }

  /**
   * Get current memory usage (Chrome/Chromium/Firefox)
   */
  getMemoryUsage() {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usedMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
      totalMB: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
      limitMB: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2),
      percentage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)
    }
  }

  /**
   * Count total DOM nodes
   */
  getDOMNodeCount() {
    return document.getElementsByTagName('*').length
  }

  /**
   * Get app uptime in milliseconds
   */
  getUptime() {
    return Date.now() - this.startTime
  }

  /**
   * Calculate memory growth rate in MB/hour
   */
  getMemoryGrowthRate() {
    if (this.snapshots.length < 2) {
      return 0
    }

    const oldest = this.snapshots[0]
    const newest = this.snapshots[this.snapshots.length - 1]

    const timeDiffMs = newest.timestamp - oldest.timestamp
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60)

    if (timeDiffHours === 0) {
      return 0
    }

    const memoryDiffBytes = newest.memory.usedJSHeapSize - oldest.memory.usedJSHeapSize
    const memoryDiffMB = memoryDiffBytes / 1048576

    return (memoryDiffMB / timeDiffHours).toFixed(2)
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return this.snapshots
  }

  /**
   * Get the most recent snapshot
   */
  getLatestSnapshot() {
    return this.snapshots[this.snapshots.length - 1] || this.takeSnapshot()
  }

  /**
   * Check if there's a potential memory leak
   * Returns true if growth rate exceeds threshold
   */
  hasMemoryLeak(thresholdMBPerHour = 15) {
    const growthRate = parseFloat(this.getMemoryGrowthRate())
    return growthRate > thresholdMBPerHour
  }

  /**
   * Get a health status based on current metrics
   */
  getHealthStatus() {
    const latest = this.getLatestSnapshot()
    const growthRate = parseFloat(this.getMemoryGrowthRate())

    const percentage = parseFloat(latest.memory.percentage)

    // Check for critical conditions
    if (percentage > 85 || growthRate > 25) {
      return {
        status: 'critical',
        message: 'High memory usage or severe leak detected',
        color: 'red'
      }
    }

    if (percentage > 70 || growthRate > 15) {
      return {
        status: 'warning',
        message: 'Elevated memory usage or potential leak',
        color: 'orange'
      }
    }

    if (growthRate > 5) {
      return {
        status: 'caution',
        message: 'Minor memory growth detected',
        color: 'yellow'
      }
    }

    return {
      status: 'healthy',
      message: 'Memory usage is normal',
      color: 'green'
    }
  }

  /**
   * Export all data as JSON for analysis
   */
  exportReport() {
    return {
      generatedAt: new Date().toISOString(),
      uptime: this.getUptime(),
      currentSnapshot: this.getLatestSnapshot(),
      growthRate: this.getMemoryGrowthRate(),
      healthStatus: this.getHealthStatus(),
      snapshots: this.snapshots,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    }
  }

  /**
   * Download report as JSON file
   */
  downloadReport() {
    const report = this.exportReport()
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memory-report-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Subscribe to snapshot updates
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify all listeners of updates
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in memory monitor listener:', error)
      }
    })
  }

  /**
   * Clear all snapshots and reset counters
   */
  reset() {
    this.snapshots = []
    this.startTime = Date.now()
    this.notifyListeners()
  }
}

// Global singleton instance
let globalMemoryMonitor = null

export function getGlobalMemoryMonitor() {
  if (!globalMemoryMonitor) {
    globalMemoryMonitor = new MemoryMonitor()
  }
  return globalMemoryMonitor
}

export default MemoryMonitor
