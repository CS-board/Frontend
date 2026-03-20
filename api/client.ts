/**
 * 백엔드 API 호출 + JWT(Access Token) 자동 갱신.
 * RT는 httpOnly 쿠키, AT는 localStorage(TOKEN_KEY)에 둠.
 */
import { TOKEN_KEY } from '@/constants'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

/** AT 만료 시각보다 이 만큼 일찍 선제 갱신 (5분) */
const REFRESH_BUFFER_MS = 5 * 60 * 1000

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    )
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function isTokenExpiredOrExpiring(token: string): boolean {
  const expiry = getTokenExpiry(token)
  if (!expiry) return true
  return Date.now() >= expiry - REFRESH_BUFFER_MS
}

/** 갱신 결과: ok면 새 AT, 실패 시 logout 여부(재로그인 필요 vs 일시 오류) */
type RefreshResult =
  | { ok: true; token: string }
  | { ok: false; logout: boolean }

class ApiClient {
  private baseURL: string
  private isRefreshing = false
  private refreshSubscribers: Array<(result: RefreshResult) => void> = []
  private refreshTimer: ReturnType<typeof setTimeout> | null = null

  constructor(baseURL: string | undefined) {
    if (!baseURL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다')
    }
    this.baseURL = baseURL
  }

  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    const token = localStorage.getItem(TOKEN_KEY)
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private notifySubscribers(result: RefreshResult) {
    this.refreshSubscribers.forEach(cb => cb(result))
    this.refreshSubscribers = []
  }

  private subscribeTokenRefresh(cb: (result: RefreshResult) => void) {
    this.refreshSubscribers.push(cb)
  }

  /** POST /auth/refresh (쿠키 RT). 401/403/404면 재로그인, 그 외/네트워크는 비로그아웃 실패 */
  async tryRefreshToken(): Promise<RefreshResult> {
    try {
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (res.status === 401 || res.status === 403) {
        return { ok: false, logout: true }
      }

      if (res.status === 404) {
        return { ok: false, logout: true }
      }

      if (!res.ok) {
        return { ok: false, logout: false }
      }

      const json = await res.json()
      const token: string | undefined = json?.data?.token
      if (!token) return { ok: false, logout: false }

      localStorage.setItem(TOKEN_KEY, token)
      this.scheduleProactiveRefresh(token)
      return { ok: true, token }
    } catch {
      return { ok: false, logout: false }
    }
  }

  /** 다음 만료 5분 전에 백그라운드로 한 번 더 갱신 예약 */
  scheduleProactiveRefresh(token: string) {
    if (typeof window === 'undefined') return
    if (this.refreshTimer) clearTimeout(this.refreshTimer)

    const expiry = getTokenExpiry(token)
    if (!expiry) return

    const delay = expiry - Date.now() - REFRESH_BUFFER_MS
    if (delay <= 0) return

    this.refreshTimer = setTimeout(async () => {
      if (this.isRefreshing) return
      this.isRefreshing = true
      const result = await this.tryRefreshToken()
      this.isRefreshing = false
      this.notifySubscribers(result)
      if (!result.ok && result.logout) {
        localStorage.removeItem(TOKEN_KEY)
        window.location.href = '/login'
      }
    }, delay)
  }

  private buildConfig(options: RequestInit): RequestInit {
    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...(options.headers as Record<string, string> | undefined),
      },
      credentials: 'include',
    }
  }

  private forceLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // 요청 전: AT가 곧 만료면 먼저 갱신
    if (typeof window !== 'undefined' && !this.isRefreshing) {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token && isTokenExpiredOrExpiring(token)) {
        this.isRefreshing = true
        const result = await this.tryRefreshToken()
        this.isRefreshing = false
        this.notifySubscribers(result)

        if (!result.ok) {
          if (result.logout) {
            this.forceLogout()
            throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
          }
          // logout 아님(네트워크 등) → 만료된 AT로 그대로 요청(서버가 401 줄 수 있음)
        }
      }
    }

    const config = this.buildConfig(options)
    const response = await fetch(url, config)

    if (response.status !== 401) {
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.msg || errorBody?.message || response.statusText)
      }
      return response.json()
    }

    // 401이면 갱신 후 원요청 1회 재시도
    if (!this.isRefreshing) {
      this.isRefreshing = true
      const result = await this.tryRefreshToken()
      this.isRefreshing = false
      this.notifySubscribers(result)

      if (!result.ok) {
        if (result.logout) {
          this.forceLogout()
        }
        throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
      }

      const retryConfig: RequestInit = {
        ...config,
        headers: {
          ...(config.headers as Record<string, string>),
          Authorization: `Bearer ${result.token}`,
        },
      }
      const retryRes = await fetch(url, retryConfig)
      if (!retryRes.ok) {
        const errorBody = await retryRes.json().catch(() => null)
        throw new Error(errorBody?.msg || errorBody?.message || retryRes.statusText)
      }
      return retryRes.json()
    }

    // 동시 요청: 이미 갱신 중이면 완료 후 같은 방식으로 재시도
    return new Promise<T>((resolve, reject) => {
      this.subscribeTokenRefresh(async (result) => {
        if (!result.ok) {
          reject(new Error('세션이 만료되었습니다. 다시 로그인해 주세요.'))
          return
        }
        const retryConfig: RequestInit = {
          ...config,
          headers: {
            ...(config.headers as Record<string, string>),
            Authorization: `Bearer ${result.token}`,
          },
        }
        try {
          const res = await fetch(url, retryConfig)
          if (!res.ok) {
            const err = await res.json().catch(() => null)
            reject(new Error(err?.msg || err?.message || res.statusText))
          } else {
            resolve(await res.json())
          }
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
