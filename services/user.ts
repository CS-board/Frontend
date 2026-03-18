import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, UserProfileDetail } from '@/types'

export const userService = {
  async getDetail(): Promise<UserProfileDetail> {
    const res = await apiClient.get<ApiResponse<UserProfileDetail>>(API_ENDPOINTS.USERS.ME_DETAIL)
    return res.data
  },

  async updateGrade(grade: number): Promise<{ grade: number }> {
    const res = await apiClient.patch<ApiResponse<{ grade: number }>>(
      API_ENDPOINTS.USERS.GRADE,
      { grade }
    )
    return res.data
  },

  async updateDepartment(department: string): Promise<{ department: string }> {
    const res = await apiClient.patch<ApiResponse<{ department: string }>>(
      API_ENDPOINTS.USERS.DEPARTMENT,
      { department }
    )
    return res.data
  },
}
