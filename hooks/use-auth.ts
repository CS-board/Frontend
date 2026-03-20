"use client"

/** 앱 최초 로드 시 localStorage AT로 로그인 여부·JWT 클레임 표시. 만료 시 조용히 refresh 시도. */
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

    if (!claims.exp || claims.exp > now) {
      setUser(claims)
      setIsLoggedIn(true)
      setLoading(false)
      return
    }

    // AT 만료: refresh만 시도(실패 시 로그아웃 처리)
    fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
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
          import("@/api/client").then(({ apiClient }) => {
            apiClient.scheduleProactiveRefresh(newToken)
          })
        } catch {
          localStorage.removeItem(TOKEN_KEY)
        }
      })
      .catch(() => {
        // 네트워크 오류: 토큰 유지, 다음 API에서 apiClient가 재시도
        setUser(claims)
        setIsLoggedIn(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { user, isLoggedIn, loading }
}
