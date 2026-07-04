import { Navigate, Outlet } from 'react-router-dom'
import { getToken } from '../lib/api'

// Guards the app: if there's no stored JWT, bounce to the login screen.
export function RequireAuth() {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
