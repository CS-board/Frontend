/** 내 기록 요약·주차·진행·일별 풀이·목표점수 */
import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  MyProgressSummary,
  MyRecordSummary,
  MyRecordWeeksResponse,
  DailySolvedResponse,
} from '@/types'

export const recordService = {
  async getSummary(): Promise<MyRecordSummary> {
    const res = await apiClient.get<ApiResponse<MyRecordSummary>>(API_ENDPOINTS.ME.SUMMARY)
    return res.data
  },

  async getWeeks(page = 0, size = 10): Promise<MyRecordWeeksResponse> {
    const res = await apiClient.get<ApiResponse<MyRecordWeeksResponse>>(
      `${API_ENDPOINTS.ME.WEEKS}?page=${page}&size=${size}`
    )
    return res.data
  },

  async getProgressSummary(challengeId: number): Promise<MyProgressSummary> {
    const res = await apiClient.get<ApiResponse<MyProgressSummary>>(
      API_ENDPOINTS.ME.PROGRESS_SUMMARY(challengeId)
    )
    return res.data
  },

  async getDailySolved(challengeId: number, date: string): Promise<DailySolvedResponse> {
    const res = await apiClient.get<ApiResponse<DailySolvedResponse>>(
      `${API_ENDPOINTS.ME.DAILY_SOLVED(challengeId)}?date=${date}`
    )
    return res.data
  },

  async updateGoalPoints(goalPoints: number): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.ME.GOAL_POINTS, { goalPoints })
  },
}
