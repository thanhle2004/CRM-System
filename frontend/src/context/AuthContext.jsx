import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/auth'

const AuthContext = createContext(null)

function getStoredToken() {
  return localStorage.getItem('crm_token')
}

function setStoredToken(token) {
  if (token) {
    localStorage.setItem('crm_token', token)
    return
  }

  localStorage.removeItem('crm_token')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getStoredToken()))

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!getStoredToken()) {
        setLoading(false)
        return
      }

      try {
        const response = await getMe()
        if (!cancelled) {
          setUser(response.data)
        }
      } catch {
        setStoredToken(null)
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  async function login(credentials) {
    const response = await loginRequest(credentials)
    setStoredToken(response.data.accessToken)
    setUser(response.data.user)
    return response
  }

  async function register(payload) {
    const response = await registerRequest(payload)
    setStoredToken(response.data.accessToken)
    setUser(response.data.user)
    return response
  }

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      setStoredToken(null)
      setUser(null)
    }
  }

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    setUser,
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
