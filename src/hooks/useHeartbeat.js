import { useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export function useHeartbeat() {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Send immediately on mount
    const ping = () => {
      axios.post(`${API}/auth/heartbeat`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }

    ping()
    const interval = setInterval(ping, 1000 * 60 * 3) // every 30 seconds
    return () => clearInterval(interval)
  }, [])
}