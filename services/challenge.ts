/** 챌린지 요약/상세/랭킹 페이지네이션 */
import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, ChallengeSummary, ChallengeDetails, ChallengeRankingResponse } from '@/types'

export const challengeService = {
  async getSummary(challengeId: number): Promise<ChallengeSummary> {
    const res = await apiClient.get<ApiResponse<ChallengeSummary>>(
      API_ENDPOINTS.CHALLENGES.INFO_SUMMARY(challengeId)
    )
    return res.data
  },

  async getDetails(challengeId: number): Promise<ChallengeDetails> {
    const res = await apiClient.get<ApiResponse<ChallengeDetails>>(
      API_ENDPOINTS.CHALLENGES.INFO_DETAILS(challengeId)
    )
    return res.data
  },

  async getRankings(challengeId: number, page = 0, size = 20): Promise<ChallengeRankingResponse> {
    const res = await apiClient.get<ApiResponse<ChallengeRankingResponse>>(
      `${API_ENDPOINTS.CHALLENGES.RANKINGS(challengeId)}?page=${page}&size=${size}`
    )
    return res.data
  },
}
