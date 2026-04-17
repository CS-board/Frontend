/** 챌린지 요약/상세/랭킹 페이지네이션 */
import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import type {
  ApiResponse,
  ChallengeSummary,
  ChallengeDetails,
  ChallengeRankingResponse,
  ChallengeListItem,
  ChallengeStatus,
} from '@/types'

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.length > 0) return v
  }
  return ''
}

function pickChallengeId(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v
    if (typeof v === 'string' && v !== '') {
      const n = parseInt(v, 10)
      if (Number.isFinite(n) && n > 0) return n
    }
  }
  return 0
}

function normalizeChallengeListRaw(raw: unknown): ChallengeListItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const challengeId = pickChallengeId(o.challengeId, o.challenge_id)
  const title = pickStr(o.title)
  const startAt = pickStr(o.startAt, o.start_at)
  const endAt = pickStr(o.endAt, o.end_at)
  const statusRaw = pickStr(o.status as string)
  const status: ChallengeStatus =
    statusRaw === 'SCHEDULED' || statusRaw === 'ACTIVE' || statusRaw === 'CLOSED' ? statusRaw : 'CLOSED'
  if (!challengeId || !startAt || !endAt) return null
  return { challengeId, title, startAt, endAt, status }
}

function extractChallengeListPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.items)) return o.items
    if (o.challengeId != null || o.challenge_id != null) return [data]
  }
  return []
}

export const challengeService = {
  async listChallenges(): Promise<ChallengeListItem[]> {
    const res = await apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.CHALLENGES.LIST)
    return extractChallengeListPayload(res.data)
      .map(normalizeChallengeListRaw)
      .filter((x): x is ChallengeListItem => x != null)
  },

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
