/** 백엔드 API 응답·도메인 타입 모음 */

/** 로그인 */
export interface LoginResponse {
  token: string
  expiredIn: string
}

/** 챌린지·랭킹 */
export type ChallengeStatus = "SCHEDULED" | "ACTIVE" | "CLOSED"

export interface ChallengeSummary {
  title: string
  startAt: string
  endAt: string
  status: ChallengeStatus
}

export interface ChallengeDetails extends ChallengeSummary {
  totalUserCount: number
  participantsCount: number
  totalSolvedCount: number
  lastUpdatedAt: string
}

export interface ChallengeRankingItem {
  rank: number
  userId: number
  name: string
  bojId: string
  department: string
  grade: number
  totalPoints: number
  solvedCount: number
}

export interface ChallengeRankingResponse {
  challengeId: number
  generatedAt: string
  page: number
  size: number
  totalElements: number
  hasNext: boolean
  nextPage: number
  items: ChallengeRankingItem[]
}

/** 내 기록(/me/records) */
export interface MyProgressSummary {
  currentRank: number
  currentScore: number
  scoreDelta: number
  goalScore: number
  achievementRate: number
}

export interface MyRecordSummary {
  maxPoints: number
  totalSolvedCount: number
}

export interface MyRecordWeekItem {
  challengeId: number
  title: string
  startAt: string
  endAt: string
  rank: number
  totalPoints: number
  solvedCount: number
}

export interface MyRecordWeeksResponse {
  items: MyRecordWeekItem[]
  page: number
  size: number
  hasNext: boolean
}

export interface DailySolvedProblem {
  problemId: number
  titleKo: string
  level: number
}

export interface DailySolvedResponse {
  date: string
  count: number
  items: DailySolvedProblem[]
}

/** 공지 게시판 */
export interface BoardPostListItem {
  id: number
  title: string
  pinned: boolean
  createdAt: string
}

export interface BoardPostListResponse {
  items: BoardPostListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface BoardPostDetail {
  id: number
  title: string
  content: string
  pinned: boolean
  createdAt: string
}

/** Q&A */
export interface QuestionSummary {
  id: number
  title: string
  authorId: number
  authorName: string
  timeAgo: string
  solved: boolean
  commentCount: number
  likeCount: number
}

export interface QuestionListResponse {
  items: QuestionSummary[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CommentResponse {
  id: number
  authorId: number
  authorName: string
  content: string
  timeAgo: string
  deleted: boolean
}

export interface QuestionDetail {
  id: number
  title: string
  content: string
  authorId: number
  authorName: string
  timeAgo: string
  solved: boolean
  commentCount: number
  likeCount: number
  comments: CommentResponse[]
}

/** 설정·프로필 */
export interface UserProfileDetail {
  name: string
  studentId: string
  department: string
  grade: number
  email: string
  bojId: string
  goalPoints: number
}

/** 공통 래퍼 */
export interface ApiResponse<T> {
  success: string
  data: T
}

export interface PageInfo {
  page: number
  size: number
}
