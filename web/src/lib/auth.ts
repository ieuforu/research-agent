import { redirect } from '@tanstack/react-router'

// --- Mock auth state ---
// In production, replace with real token/session validation
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
    throw redirect({ to: '/examples' })
  }
}
