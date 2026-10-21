import { redirect } from '@tanstack/react-router'

// --- Session state ---
// The token is a JWT issued by POST /api/auth/login; the backend is the only
// thing that validates it, this just decides what the router renders.
export function isAuthenticated(): boolean {
  return window.localStorage.getItem('auth_token') !== null
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem('auth_token')
}

export function setAuthToken(token: string) {
  window.localStorage.setItem('auth_token', token)
}

export function clearAuthToken() {
  window.localStorage.removeItem('auth_token')
}

// --- Route guard helper ---
// Use in beforeLoad to protect routes
export function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}

// Redirect logged-in users away from auth pages
export function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    throw redirect({ to: '/research' })
  }
}
