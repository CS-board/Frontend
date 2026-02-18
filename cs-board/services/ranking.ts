// 랭킹 관련 서비스

import { apiClient } from '@/api/client'
import type { ChallengeRankingItem, ChallengeDetails } from '@/types'

export const rankingService = {
  // 주간 랭킹 조회
  async getWeeklyRankings(week?: string): Promise<ChallengeRankingItem[]> {
    const endpoint = week ? `/rankings/weekly?week=${week}` : '/rankings/weekly'
    return apiClient.get<ChallengeRankingItem[]>(endpoint)
  },

  // 전체 랭킹 조회
  async getAllRankings(): Promise<ChallengeRankingItem[]> {
    return apiClient.get<ChallengeRankingItem[]>('/rankings/all')
  },

  // 챌린지 정보 조회
  async getChallengeInfo(week?: string): Promise<ChallengeDetails> {
    const endpoint = week ? `/challenges/info?week=${week}` : '/challenges/info'
    return apiClient.get<ChallengeDetails>(endpoint)
  },
}
