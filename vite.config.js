import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/current_track_xhr': 'http://localhost:5000',
      '/play': 'http://localhost:5000',
      '/pause': 'http://localhost:5000',
      '/skip': 'http://localhost:5000',
      '/like': 'http://localhost:5000',
      '/unlike': 'http://localhost:5000',
      '/sign_out': 'http://localhost:5000',
      '/currently_playing': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
    }
  },
  build: {
    outDir: 'static/react-build',
    emptyOutDir: true,
    manifest: true,  // Generate manifest.json for Flask to read
  }
})