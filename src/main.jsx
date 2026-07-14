import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ThemeProvider } from './hooks/useTheme'

import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SpeedInsights } from '@vercel/speed-insights/react'

const isSpeedInsightsEnabled = import.meta.env.VITE_ENABLE_SPEED_INSIGHTS === 'true'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
    {isSpeedInsightsEnabled && <SpeedInsights />}
  </React.StrictMode>,
)