// 랭킹 관련 서비스

import { apiClient } from '@/api/client'
import type { Ranking, Challenge } from '@/types'

export const rankingService = {
  // 주간 랭킹 조회
  async getWeeklyRankings(week?: string): Promise<Ranking[]> {
    const endpoint = week ? `/rankings/weekly?week=${week}` : '/rankings/weekly'
    return apiClient.get<Ranking[]>(endpoint)
  },

  // 전체 랭킹 조회
  async getAllRankings(): Promise<Ranking[]> {
    return apiClient.get<Ranking[]>('/rankings/all')
  },

  // 챌린지 정보 조회
  async getChallengeInfo(week?: string): Promise<Challenge> {
    const endpoint = week ? `/challenges/info?week=${week}` : '/challenges/info'
    return apiClient.get<Challenge>(endpoint)
  },
}
