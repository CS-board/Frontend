"use client"

import { useEffect, useState } from "react"
import { TOKEN_KEY } from "@/constants"

export interface AuthUser {
  name?: string
  sub?: string
  studentId?: string
  department?: string
  grade?: number
  bojId?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

function parseTokenClaims(token: string): AuthUser & { exp?: number } {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
  return JSON.parse(atob(base64))
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    let claims: ReturnType<typeof parseTokenClaims>
    try {
      claims = parseTokenClaims(token)
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setLoading(false)
      return
    }

    const now = Math.floor(Date.now() / 1000)

    // Token still valid — use it immediately
    if (!claims.exp || claims.exp > now) {
      setUser(claims)
      setIsLoggedIn(true)
      setLoading(false)
      return
    }

    // AT is expired — silently try to refresh before giving up
    fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          // 401/403: RT is also dead — clear and stay logged out
          localStorage.removeItem(TOKEN_KEY)
          return
        }
        const json = await res.json()
        const newToken: string | undefined = json?.data?.token
        if (!newToken) {
          localStorage.removeItem(TOKEN_KEY)
          return
        }
        localStorage.setItem(TOKEN_KEY, newToken)
        try {
          const newClaims = parseTokenClaims(newToken)
          setUser(newClaims)
          setIsLoggedIn(true)
          // Tell apiClient to schedule the next proactive refresh
          import("@/api/client").then(({ apiClient }) => {
            apiClient.scheduleProactiveRefresh(newToken)
          })
        } catch {
          localStorage.removeItem(TOKEN_KEY)
        }
      })
      .catch(() => {
        // Network error — don't clear the token; let next API call retry
        // Show as logged in with existing (stale) claims so UI is not disrupted
        setUser(claims)
        setIsLoggedIn(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { user, isLoggedIn, loading }
}
