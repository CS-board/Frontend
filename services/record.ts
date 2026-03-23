/** 내 기록 요약·주차·진행·일별 풀이·목표점수 */
import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import { challengeService } from '@/services/challenge'
import type {
  ApiResponse,
  ChallengeListItem,
  MyProgressSummary,
  MyRecordSummary,
  MyRecordWeekItem,
  MyRecordWeeksResponse,
  DailySolvedResponse,
} from '@/types'

function dateKey(iso: string): string {
  if (!iso) return ''
  const [part] = iso.split('T')
  return part ?? ''
}

function normalizeMyRecordWeekRaw(raw: unknown): MyRecordWeekItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const cidRaw = o.challengeId ?? o.challenge_id
  let challengeId = 0
  if (typeof cidRaw === 'number' && Number.isFinite(cidRaw) && cidRaw > 0) challengeId = cidRaw
  else if (typeof cidRaw === 'string' && cidRaw !== '') {
    const n = parseInt(cidRaw, 10)
    if (Number.isFinite(n) && n > 0) challengeId = n
  }

  const title = typeof o.title === 'string' ? o.title : ''
  const startAt =
    typeof o.startAt === 'string' ? o.startAt : typeof o.start_at === 'string' ? o.start_at : ''
  const endAt = typeof o.endAt === 'string' ? o.endAt : typeof o.end_at === 'string' ? o.end_at : ''

  const rankRaw = o.rank
  const rank =
    typeof rankRaw === 'number' && Number.isFinite(rankRaw)
      ? rankRaw
      : typeof rankRaw === 'string'
        ? parseInt(rankRaw, 10) || 0
        : 0

  const tpRaw = o.totalPoints ?? o.total_points
  const totalPoints =
    typeof tpRaw === 'number' && Number.isFinite(tpRaw) ? tpRaw : typeof tpRaw === 'string' ? parseFloat(tpRaw) || 0 : 0

  const scRaw = o.solvedCount ?? o.solved_count
  const solvedCount =
    typeof scRaw === 'number' && Number.isFinite(scRaw) ? scRaw : typeof scRaw === 'string' ? parseInt(scRaw, 10) || 0 : 0

  if (!startAt) return null

  return {
    challengeId,
    title,
    startAt,
    endAt,
    rank,
    totalPoints,
    solvedCount,
  }
}

function enrichWeekItemsWithChallengeIds(
  items: MyRecordWeekItem[],
  challenges: ChallengeListItem[]
): MyRecordWeekItem[] {
  if (challenges.length === 0) return items
  return items.map((item) => {
    if (item.challengeId > 0) return item
    const byDates = challenges.find(
      (c) => dateKey(item.startAt) === dateKey(c.startAt) && dateKey(item.endAt) === dateKey(c.endAt)
    )
    if (byDates) return { ...item, challengeId: byDates.challengeId }
    if (item.title) {
      const byTitle = challenges.find((c) => c.title === item.title)
      if (byTitle) return { ...item, challengeId: byTitle.challengeId }
    }
    return item
  })
}

export const recordService = {
  async getSummary(): Promise<MyRecordSummary> {
    const res = await apiClient.get<ApiResponse<MyRecordSummary>>(API_ENDPOINTS.ME.SUMMARY)
    return res.data
  },

  async getWeeks(page = 0, size = 10): Promise<MyRecordWeeksResponse> {
    const [res, challenges] = await Promise.all([
      apiClient.get<ApiResponse<{ items?: unknown[] } & Omit<MyRecordWeeksResponse, 'items'>>>(
        `${API_ENDPOINTS.ME.WEEKS}?page=${page}&size=${size}`
      ),
      challengeService.listChallenges().catch(() => [] as ChallengeListItem[]),
    ])

    const rawItems = res.data.items
    const normalized = Array.isArray(rawItems)
      ? rawItems.map(normalizeMyRecordWeekRaw).filter((x): x is MyRecordWeekItem => x != null)
      : []

    return {
      page: res.data.page,
      size: res.data.size,
      hasNext: res.data.hasNext,
      items: enrichWeekItemsWithChallengeIds(normalized, challenges),
    }
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
