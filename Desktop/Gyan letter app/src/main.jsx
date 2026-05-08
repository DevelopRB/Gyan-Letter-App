import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const CANONICAL_HOST = 'gyan-letter-app.onrender.com'
const LEGACY_HOSTS = ['gyan-letter-app-1.onrender.com']

if (import.meta.env.PROD && LEGACY_HOSTS.includes(window.location.hostname)) {
  const targetUrl = `https://${CANONICAL_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`
  window.location.replace(targetUrl)
}

// Suppress findDOMNode warnings from ReactQuill (known issue with react-quill v2.0.0)
// This is a harmless warning from the library's internal code
const originalWarn = console.warn
const originalError = console.error

const shouldSuppress = (args) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0])
  return message.includes('findDOMNode is deprecated') || 
         message.includes('Warning: findDOMNode')
}

console.warn = (...args) => {
  if (shouldSuppress(args)) return
  originalWarn.apply(console, args)
}

console.error = (...args) => {
  if (shouldSuppress(args)) return
  originalError.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


