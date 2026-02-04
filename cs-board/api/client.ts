import { TOKEN_KEY } from '@/constants'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

class ApiClient {
  private baseURL: string

  constructor(baseURL: string | undefined) {
    if (!baseURL) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다")
    }
    this.baseURL = baseURL
  }

  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    const token = localStorage.getItem(TOKEN_KEY)
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const message = errorBody?.msg || errorBody?.message || response.statusText
      throw new Error(message)
    }

    return await response.json()
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
