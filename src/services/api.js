import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const fetchUsers    = () => axios.get(`${API}/auth/users`,    getHeaders()).then(r => r.data)
export const fetchPillars  = () => axios.get(`${API}/pillars`,       getHeaders()).then(r => r.data)
export const fetchPCRs     = () => axios.get(`${API}/pcr`,           getHeaders()).then(r => r.data)