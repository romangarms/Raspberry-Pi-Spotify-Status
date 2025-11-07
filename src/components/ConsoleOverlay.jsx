import { useEffect, useRef } from 'react'

function ConsoleOverlay({ logs, onClose, onClear }) {
  const bottomRef = useRef(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const copyLogs = () => {
    const text = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      alert('Logs copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy logs:', err)
    })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
      }}>
        <h2 style={{ margin: 0, color: '#fff' }}>Console Logs ({logs.length})</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={copyLogs}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Copy
          </button>
          <button
            onClick={onClear}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Clear
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
            No logs captured yet
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #333',
                color: log.type === 'error' ? '#f44336' : log.type === 'warn' ? '#ff9800' : '#4caf50',
              }}
            >
              <span style={{ color: '#888', marginRight: '10px' }}>[{log.timestamp}]</span>
              <span style={{
                color: log.type === 'error' ? '#f44336' : log.type === 'warn' ? '#ff9800' : '#2196F3',
                fontWeight: 'bold',
                marginRight: '10px',
              }}>
                [{log.type.toUpperCase()}]
              </span>
              <span style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>{log.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default ConsoleOverlay
