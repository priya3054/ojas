import axios from 'axios'

// In development, requests go to /api/* which Vite proxies to the FastAPI backend.
// In production (Vercel), VITE_API_URL points directly at the deployed backend's URL.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

const TOKEN_KEY = 'ojas_token'

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Interceptor: before every request leaves, attach the JWT (if we have one) as a
// Bearer token — exactly the header the backend's get_current_user dependency expects.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
