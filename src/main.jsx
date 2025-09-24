import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Root element
createRoot(document.getElementById('root')).render(
  // <StrictMode> // Disabled to prevent double rendering in development
    <App />
  // </StrictMode>,
)
