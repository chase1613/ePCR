import { useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const INTERVAL = 1000 * 60 * 5 // ✅ every 5 minutes instead of 1

export function useHeartbeat() {
  useEffect(() => {
    const ping = () => {
      // ✅ Skip if user is on a different tab
      if (document.visibilityState === 'hidden') return

      // ✅ Read token fresh every ping
      const token = localStorage.getItem('token')
      if (!token) return

      axios.post(`${API}/auth/heartbeat`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }

    ping() // fire immediately on mount
    const interval = setInterval(ping, INTERVAL)

    // ✅ Also ping when user returns to the tab
    document.addEventListener('visibilitychange', ping)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', ping)
    }
  }, [])
}