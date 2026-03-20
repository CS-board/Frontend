/**
 * 레거시/미사용 가능: 실제 랭킹은 challengeService.getRankings 사용.
 * 백엔드에 /rankings/weekly 등이 있을 때만 쓰임.
 */
import { apiClient } from '@/api/client'
import type { ChallengeRankingItem, ChallengeDetails } from '@/types'

export const rankingService = {
  async getWeeklyRankings(week?: string): Promise<ChallengeRankingItem[]> {
    const endpoint = week ? `/rankings/weekly?week=${week}` : '/rankings/weekly'
    return apiClient.get<ChallengeRankingItem[]>(endpoint)
  },

  async getAllRankings(): Promise<ChallengeRankingItem[]> {
    return apiClient.get<ChallengeRankingItem[]>('/rankings/all')
  },

  async getChallengeInfo(week?: string): Promise<ChallengeDetails> {
    const endpoint = week ? `/challenges/info?week=${week}` : '/challenges/info'
    return apiClient.get<ChallengeDetails>(endpoint)
  },
}
