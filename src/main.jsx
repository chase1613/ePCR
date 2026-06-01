import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import axios from 'axios'
import * as Sentry from '@sentry/react'

// ── Sentry: initialize before anything else ──
if (import.meta.env.DEV) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENV ?? 'production',
    release: import.meta.env.VITE_APP_VERSION,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: 0.05,
    beforeSend(event) {
      const status = event.extra?.status ?? event.contexts?.response?.status_code
      if ([401, 403, 404].includes(status)) return null
      return event
    },
  })
}

// ── Axios interceptor: auto logout on 401 ──
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginRequest) {
      // Capture the error before wiping state
      Sentry.captureException(err, {
        tags: { trigger: 'auto_logout' },
      })
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── REMOVED: console.error suppression ──
// Sentry now captures what this was hiding

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => Sentry.captureException(error),
  }),
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary
    fallback={<p>Something went wrong. Our team has been notified.</p>}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
)