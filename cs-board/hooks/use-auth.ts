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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
      const claims = JSON.parse(atob(base64))
      const now = Math.floor(Date.now() / 1000)
      if (claims.exp && claims.exp < now) {
        localStorage.removeItem(TOKEN_KEY)
        setLoading(false)
        return
      }
      setUser(claims)
      setIsLoggedIn(true)
    } catch {
      localStorage.removeItem(TOKEN_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, isLoggedIn, loading }
}
