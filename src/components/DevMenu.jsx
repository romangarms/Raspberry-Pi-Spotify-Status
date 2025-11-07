import { useState, useEffect } from 'react'
import ConsoleOverlay from './ConsoleOverlay'
import MemoryOverlay from './MemoryOverlay'
import useConsoleCapture from '../hooks/useConsoleCapture'
import { getGlobalMemoryMonitor } from '../utils/memoryMonitor'

function DevMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [appStartTime] = useState(Date.now())
  const { logs, clearLogs } = useConsoleCapture()

  // Check if app has error and make button visible
  useEffect(() => {
    const checkErrorState = () => {
      if (window.__APP_HAS_ERROR__) {
        setShowButton(true)
      }
    }

    // Check immediately
    checkErrorState()

    // Check every second in case error occurs later
    const interval = setInterval(checkErrorState, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleReload = () => {
    window.location.reload()
  }

  const handleViewConsole = () => {
    setShowConsole(true)
  }

  const handleViewMemory = () => {
    setShowMemory(true)
  }

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      window.location.href = '/sign_out'
    }
  }

  const handleShowInfo = () => {
    const uptime = Math.floor((Date.now() - appStartTime) / 1000)
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = uptime % 60
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`

    // Get memory stats
    const memoryMonitor = getGlobalMemoryMonitor()
    const memoryUsage = memoryMonitor.getMemoryUsage()
    const domNodes = memoryMonitor.getDOMNodeCount()
    const healthStatus = memoryMonitor.getHealthStatus()

    const infoLines = [
      `App Uptime: ${uptimeStr}`,
      `User Agent: ${navigator.userAgent}`,
      `Screen: ${window.screen.width}x${window.screen.height}`,
      `Viewport: ${window.innerWidth}x${window.innerHeight}`,
      `Logs Captured: ${logs.length}`,
      `Fullscreen: ${document.fullscreenElement ? 'Yes' : 'No'}`,
    ]

    // Add memory info if available
    if (memoryUsage) {
      infoLines.push(
        '',
        '--- Memory Stats ---',
        `JS Heap: ${memoryUsage.usedMB} MB / ${memoryUsage.limitMB} MB (${memoryUsage.percentage}%)`,
        `DOM Nodes: ${domNodes}`,
        `Event Listeners: ${memoryMonitor.eventListenerCount}`,
        `Active Intervals: ${memoryMonitor.intervalTimerCount}`,
        `Health: ${healthStatus.status.toUpperCase()}`
      )
    }

    alert(infoLines.join('\n\n'))
  }

  const menuButtons = [
    { label: 'Reload Page', onClick: handleReload, color: '#2196F3' },
    { label: 'View Console Logs', onClick: handleViewConsole, color: '#4CAF50' },
    { label: 'Memory Monitor', onClick: handleViewMemory, color: '#9C27B0' },
    { label: 'Sign Out', onClick: handleSignOut, color: '#f44336' },
    { label: 'Show App Info', onClick: handleShowInfo, color: '#00BCD4' },
    { label: 'Close Menu', onClick: () => setMenuOpen(false), color: '#666' },
  ]

  return (
    <>
      {/* Trigger button in lower left - invisible normally, red when error occurs */}
      <div
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          bottom: '40px', // Above progress bar
          left: '0',
          width: '10vw', // 10% of viewport width
          height: '10vh', // 10% of viewport height
          zIndex: 9998,
          cursor: 'pointer',
          backgroundColor: showButton ? 'rgba(244, 67, 54, 0.7)' : 'transparent', // Red when error
          borderRadius: showButton ? '0 8px 8px 0' : '0',
          transition: 'background-color 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: showButton ? '24px' : '0',
        }}
        title="Developer Menu"
      >
        {showButton && '🐛'}
      </div>

      {/* Menu overlay */}
      {menuOpen && (
        <>
          {/* Background overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9999,
            }}
          />

          {/* Menu panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '300px',
              backgroundColor: '#1e1e1e',
              zIndex: 10000,
              padding: '20px',
              boxShadow: '4px 0 12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '24px' }}>
              Developer Menu
            </h2>

            {menuButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                style={{
                  padding: '16px',
                  backgroundColor: button.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  minHeight: '50px',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {button.label}
              </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #333' }}>
              <p style={{ color: '#666', fontSize: '12px', margin: 0, textAlign: 'center' }}>
                Tap lower-left corner to toggle menu
              </p>
            </div>
          </div>
        </>
      )}

      {/* Console overlay */}
      {showConsole && (
        <ConsoleOverlay
          logs={logs}
          onClose={() => setShowConsole(false)}
          onClear={() => {
            clearLogs()
            alert('Logs cleared')
          }}
        />
      )}

      {/* Memory overlay */}
      {showMemory && (
        <MemoryOverlay
          onClose={() => setShowMemory(false)}
        />
      )}
    </>
  )
}

export default DevMenu
