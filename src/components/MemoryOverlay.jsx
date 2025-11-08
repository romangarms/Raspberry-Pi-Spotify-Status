import { useRef, useEffect, useMemo } from 'react'
import useMemoryTracking from '../hooks/useMemoryTracking'

function MemoryOverlay({ onClose }) {
  const bottomRef = useRef(null)

  // Track memory with snapshots every 60 seconds
  const {
    currentSnapshot,
    snapshots,
    memoryUsage,
    growthRate,
    healthStatus,
    hasLeak,
    domNodeCount,
    eventListenerCount,
    intervalCount,
    timeoutCount,
    uptime,
    downloadReport,
    reset
  } = useMemoryTracking(60)

  // Auto-scroll to bottom when new data arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [snapshots])

  // Memoize recent snapshots to prevent recreating DOM elements on every render
  // Limit to last 15 to reduce memory and improve performance
  const recentSnapshots = useMemo(() => {
    const MAX_DISPLAY_SNAPSHOTS = 15
    return snapshots.slice(-MAX_DISPLAY_SNAPSHOTS).reverse()
  }, [snapshots])

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  const getMemoryBarColor = () => {
    if (!memoryUsage) return '#666'
    const percentage = parseFloat(memoryUsage.percentage)
    if (percentage > 85) return '#ff4444'
    if (percentage > 70) return '#ff9800'
    return '#4caf50'
  }

  const renderMiniChart = () => {
    if (snapshots.length < 2) {
      return <div style={{ color: '#888', fontSize: '14px', padding: '10px' }}>Collecting data...</div>
    }

    const maxHeight = 100
    const width = Math.min(snapshots.length * 8, 600)
    const values = snapshots
      .filter(s => s.memory)
      .map(s => parseFloat(s.memory.usedMB))

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = maxHeight - ((value - min) / range) * maxHeight
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={maxHeight} style={{ marginTop: '10px', background: '#1a1a1a', borderRadius: '4px' }}>
        <polyline
          points={points}
          fill="none"
          stroke={healthStatus.color}
          strokeWidth="2"
        />
        <text x="5" y="15" fill="#888" fontSize="12">{max.toFixed(1)} MB</text>
        <text x="5" y={maxHeight - 5} fill="#888" fontSize="12">{min.toFixed(1)} MB</text>
      </svg>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        fontFamily: 'monospace'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '2px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '24px' }}>Memory Monitor</h2>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff4444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}
      >
        {/* Health Status Banner */}
        <div
          style={{
            padding: '15px',
            backgroundColor: healthStatus.color === 'red' ? '#ff4444' :
                           healthStatus.color === 'orange' ? '#ff9800' :
                           healthStatus.color === 'yellow' ? '#ffc107' :
                           '#4caf50',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          {healthStatus.status.toUpperCase()}: {healthStatus.message}
          {hasLeak && ' ⚠️ MEMORY LEAK DETECTED'}
        </div>

        {/* Current Metrics */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#222',
            borderRadius: '8px',
            marginBottom: '20px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Current Metrics</h3>

          {/* Memory Usage Bar */}
          {memoryUsage && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>JS Heap Memory:</span>
                <span>{memoryUsage.usedMB} MB / {memoryUsage.limitMB} MB ({memoryUsage.percentage}%)</span>
              </div>
              <div style={{ width: '100%', height: '20px', backgroundColor: '#444', borderRadius: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${memoryUsage.percentage}%`,
                    height: '100%',
                    backgroundColor: getMemoryBarColor(),
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div>
              <strong>DOM Nodes:</strong> {domNodeCount}
            </div>
            <div>
              <strong>Event Listeners:</strong> {eventListenerCount}
            </div>
            <div>
              <strong>Active Intervals:</strong> {intervalCount}
            </div>
            <div>
              <strong>Active Timeouts:</strong> {timeoutCount}
            </div>
            <div>
              <strong>Uptime:</strong> {formatUptime(uptime)}
            </div>
            <div style={{ color: parseFloat(growthRate) > 15 ? '#ff4444' : parseFloat(growthRate) > 5 ? '#ff9800' : '#4caf50' }}>
              <strong>Growth Rate:</strong> {growthRate} MB/hour
            </div>
          </div>
        </div>

        {/* Memory Trend Chart */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#222',
            borderRadius: '8px',
            marginBottom: '20px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Memory Trend (Last {snapshots.length} minutes)</h3>
          {renderMiniChart()}
        </div>

        {/* Snapshot History */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#222',
            borderRadius: '8px',
            marginBottom: '20px'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Snapshot History (Last 15)</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {recentSnapshots.length === 0 ? (
              <div style={{ color: '#888' }}>No snapshots yet. Waiting for data...</div>
            ) : (
              recentSnapshots.map((snapshot) => {
                const time = new Date(snapshot.timestamp).toLocaleTimeString()
                return (
                  <div
                    key={snapshot.timestamp}
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid #333',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{time}</span>
                    <span>
                      {snapshot.memory ? `${snapshot.memory.usedMB} MB` : 'N/A'} |
                      DOM: {snapshot.domNodes} |
                      Listeners: {snapshot.eventListeners}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={downloadReport}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📥 Export Report (JSON)
          </button>
          <button
            onClick={() => {
              if (confirm('Reset all memory tracking data? This will clear the history but not fix any leaks.')) {
                reset()
              }
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ff9800',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🔄 Reset Counters
          </button>
          <button
            onClick={() => {
              if (confirm('This will reload the page. Any unsaved data will be lost. Continue?')) {
                window.location.reload()
              }
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🔃 Reload Page
          </button>
        </div>

        {/* Info Footer */}
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#1a1a1a',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#888'
          }}
        >
          <p style={{ margin: '0 0 10px 0' }}>
            💡 <strong>Tip:</strong> A healthy app should have stable or slowly growing memory.
            If you see continuous growth (&gt;15 MB/hour), there may be a memory leak.
          </p>
          <p style={{ margin: 0 }}>
            Snapshots are taken every 60 seconds. Export the report to analyze offline.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MemoryOverlay
