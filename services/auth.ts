/** 인증·회원가입·비밀번호 재설정 API 래퍼 */
import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import type { LoginResponse, ApiResponse } from '@/types'

export interface SignupRequest {
  username: string      // @kumoh.ac.kr 이메일
  password: string      // 소대문자+숫자+특수문자, 10~20자
  name: string
  department: string
  studentId: string     // 8자리 또는 10자리 숫자
  grade: number
  bojId: string
}

export interface LoginRequest {
  username: string
  password: string
}

export const authService = {
  async getDepartments(): Promise<string[]> {
    const res = await apiClient.get<ApiResponse<string[]>>(API_ENDPOINTS.REGISTER.DEPARTMENTS)
    return res.data
  },

  async sendEmailVerification(username: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.REGISTER.MAIL_SEND, { username })
  },

  async verifyEmailCode(username: string, mailCode: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.REGISTER.MAIL_VERIFY, { username, mailCode })
  },

  async validateBaekjoon(handle: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<{ valid: boolean }>>(
      API_ENDPOINTS.REGISTER.BAEKJOON_VALIDATE,
      { handle }
    )
    return res.data.valid
  },

  async signup(data: SignupRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.REGISTER.SIGNUP, data)
  },

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )
    return res.data
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  },

  async refreshToken(): Promise<LoginResponse> {
    const res = await apiClient.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.AUTH.REFRESH)
    return res.data
  },

  async sendPasswordResetMail(username: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_MAIL, { username })
  },

  async verifyPasswordResetCode(username: string, mailCode: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_MAIL_VERIFY, { username, mailCode })
  },

  async resetPassword(username: string, newPassword: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, { username, newPassword })
  },
}
