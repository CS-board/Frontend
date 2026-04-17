"use client"

import Image from "next/image"
import { useState, useMemo, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Footer } from "@/components/features/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Trophy, Medal, Users, Target, Clock,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react"
import { challengeService } from "@/services/challenge"
import type { ChallengeRankingItem, ChallengeDetails } from "@/types"

type SortKey = "rank" | "department" | "totalPoints"
type SortOrder = "asc" | "desc"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function formatDateMidnight(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 00시 00분`
}

const CACHE_KEY = "chipsat_active_challenge_id"

/** ACTIVE 시즌 id 탐색: sessionStorage 캐시 → 없으면 id 1~50 순차 조회 */
async function findLatestChallengeId(): Promise<number> {
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const cachedId = parseInt(cached, 10)
      try {
        const s = await challengeService.getSummary(cachedId)
        if (s?.status === "ACTIVE") return cachedId
        try {
          const next = await challengeService.getSummary(cachedId + 1)
          if (next?.status === "ACTIVE" || next?.status === "SCHEDULED") {
            sessionStorage.setItem(CACHE_KEY, String(cachedId + 1))
            return cachedId + 1
          }
        } catch { /* 다음 시즌 없음 */ }
        return cachedId
      } catch { /* 캐시 무효 → 아래 전체 스캔 */ }
    }
  }

  let lastValid = 1
  let consecutiveErrors = 0
  // 연속 3회 실패 시 중단(존재하지 않는 id 구간)
  for (let i = 1; i <= 50; i++) {
    try {
      const summary = await challengeService.getSummary(i)
      if (!summary) {
        consecutiveErrors++
        if (consecutiveErrors >= 3) break
        continue
      }
      consecutiveErrors = 0
      lastValid = i
      if (summary.status === "ACTIVE") {
        if (typeof window !== "undefined") sessionStorage.setItem(CACHE_KEY, String(i))
        return i
      }
    } catch {
      consecutiveErrors++
      if (consecutiveErrors >= 3) break
    }
  }
  if (typeof window !== "undefined") sessionStorage.setItem(CACHE_KEY, String(lastValid))
  return lastValid
}

export default function RankingPage() {
  const [challengeId, setChallengeId] = useState(1)
  const [details, setDetails] = useState<ChallengeDetails | null>(null)
  const [rankings, setRankings] = useState<ChallengeRankingItem[]>([])
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("rank")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    findLatestChallengeId().then(id => {
      setChallengeId(id)
      setInitializing(false)
    }).catch(() => {
      setInitializing(false)
    })
  }, [])

  const fetchData = useCallback(async (cid: number, p: number) => {
    setLoading(true)
    setError("")
    try {
      const [det, rank] = await Promise.all([
        challengeService.getDetails(cid),
        challengeService.getRankings(cid, p, 20),
      ])
      setDetails(det)
      if (p === 0) {
        setRankings(rank.items)
      } else {
        setRankings(prev => [...prev, ...rank.items])
      }
      setHasNext(rank.hasNext)
      setGeneratedAt(rank.generatedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initializing) return
    setPage(0)
    setRankings([])
    fetchData(challengeId, 0)
  }, [challengeId, fetchData, initializing])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(o => o === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortOrder(key === "totalPoints" ? "desc" : "asc") }
  }

  const sorted = useMemo(() => {
    return [...rankings].sort((a, b) => {
      let c = 0
      if (sortKey === "department") c = (a.department ?? "").localeCompare(b.department ?? "", "ko")
      else if (sortKey === "totalPoints") c = (a.totalPoints ?? 0) - (b.totalPoints ?? 0)
      else c = (a.rank ?? 0) - (b.rank ?? 0)
      return sortOrder === "asc" ? c : -c
    })
  }, [rankings, sortKey, sortOrder])

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const top3 = sorted.filter(u => u.rank >= 1 && u.rank <= 3).sort((a, b) => a.rank - b.rank)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="CHIP_SAT" width={32} height={32} className="rounded-lg" />
          <span className="font-mono text-lg font-bold text-foreground">CHIP_SAT</span>
        </div>
        <MobileMenu />
      </header>

      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl space-y-8">

            {/* 상단: 시즌 제목·기간·이전/다음 시즌 */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                {details && (
                  <Badge variant="outline" className="mb-2 font-mono">{details.title}</Badge>
                )}
                <h1 className="text-3xl font-bold text-balance">주간 랭킹</h1>
                {details && (
                  <p className="text-muted-foreground mt-2">
                    {formatDate(details.startAt)} – {formatDate(details.endAt)}
                    <Badge className="ml-2" variant={details.status === "ACTIVE" ? "default" : "secondary"}>
                      {details.status === "ACTIVE" ? "진행중" : details.status === "SCHEDULED" ? "예정" : "종료"}
                    </Badge>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setChallengeId(c => Math.max(1, c - 1))} disabled={challengeId <= 1 || loading || initializing}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-mono text-sm text-muted-foreground px-2">Season {challengeId}</span>
                <Button variant="outline" size="icon" onClick={() => setChallengeId(c => c + 1)} disabled={loading || initializing}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {(loading || initializing) && rankings.length === 0 && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            {!initializing && !loading && rankings.length === 0 && !error && (
              <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-muted-foreground">
                이번 시즌에는 아직 랭킹 데이터가 없습니다.
              </div>
            )}

            {/* 요약 카드 */}
            {!initializing && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/30">
                      <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">참여자 수</p>
                      <div className="text-2xl font-bold font-mono">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${details?.participantsCount ?? "—"}명`}
                      </div>
                      <p className="text-xs text-muted-foreground">이번 주 참여</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/30">
                      <Target className="h-7 w-7 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 풀이 수</p>
                      <div className="text-2xl font-bold font-mono">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${details?.totalSolvedCount ?? "—"}문제`}
                      </div>
                      <p className="text-xs text-muted-foreground">전체 누적</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30">
                      <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">마지막 갱신</p>
                      <div className="text-xl font-bold font-mono">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (generatedAt ? formatDateMidnight(generatedAt) : "—")}
                      </div>
                      <p className="text-xs text-muted-foreground">매일 자정 갱신</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 1~3위 포디엄 */}
            {!loading && !initializing && top3.length >= 3 && (
              <Card className="overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top 3
                  </CardTitle>
                  <CardDescription>이번 주 최고 성적을 기록한 참여자</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-center gap-6 py-4">
                    {/* 2위 */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 shadow-md ring-4 ring-slate-200 dark:ring-slate-700">
                        <span className="font-mono text-2xl font-bold text-slate-600 dark:text-slate-300">2</span>
                      </div>
                      <div className="h-28 w-28 rounded-t-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex flex-col items-center justify-center shadow-inner">
                        <Medal className="h-8 w-8 text-slate-400 mb-1" />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center px-2 truncate max-w-full">{top3[1]?.name}</span>
                        <span className="font-mono text-lg font-bold text-slate-700 dark:text-slate-200">{top3[1]?.totalPoints ?? 0}점</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-full px-1">{top3[1]?.department ?? ""}</span>
                      </div>
                    </div>
                    {/* 1위 */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg ring-4 ring-yellow-200 dark:ring-yellow-700">
                        <Trophy className="h-10 w-10 text-white drop-shadow" />
                      </div>
                      <div className="h-36 w-32 rounded-t-2xl bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-900/40 dark:to-amber-900/30 flex flex-col items-center justify-center shadow-inner border border-yellow-200/50 dark:border-yellow-700/30">
                        <span className="font-mono text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-0.5">1</span>
                        <span className="text-sm font-bold text-yellow-800 dark:text-yellow-300 text-center px-2 truncate max-w-full">{top3[0]?.name}</span>
                        <span className="font-mono text-xl font-bold text-yellow-700 dark:text-yellow-200">{top3[0]?.totalPoints ?? 0}점</span>
                        <span className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-0.5 truncate max-w-full px-1">{top3[0]?.department ?? ""}</span>
                      </div>
                    </div>
                    {/* 3위 */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 shadow-md ring-4 ring-amber-200 dark:ring-amber-800">
                        <span className="font-mono text-2xl font-bold text-white">3</span>
                      </div>
                      <div className="h-20 w-28 rounded-t-2xl bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-orange-900/20 flex flex-col items-center justify-center shadow-inner">
                        <Medal className="h-7 w-7 text-amber-500 mb-1" />
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 text-center px-2 truncate max-w-full">{top3[2]?.name}</span>
                        <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-200">{top3[2]?.totalPoints ?? 0}점</span>
                        <span className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5 truncate max-w-full px-1">{top3[2]?.department ?? ""}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 전체 테이블 */}
            {!initializing && rankings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>전체 랭킹</CardTitle>
                  <CardDescription>모든 참여자의 주간 성적 (열 제목 클릭으로 정렬)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground w-12" onClick={() => handleSort("rank")}>
                            <div className="flex items-center">순위<SortIcon k="rank" /></div>
                          </th>
                          <th className="pb-3 font-medium text-muted-foreground">이름</th>
                          <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">백준 ID</th>
                          <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => handleSort("department")}>
                            <div className="flex items-center">학과<SortIcon k="department" /></div>
                          </th>
                          <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">학년</th>
                          <th className="pb-3 text-right font-medium text-muted-foreground hidden sm:table-cell">푼 문제</th>
                          <th className="pb-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("totalPoints")}>
                            <div className="flex items-center justify-end">점수<SortIcon k="totalPoints" /></div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((user, idx) => (
                          <tr key={user.userId ?? idx} className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${user.rank >= 1 && user.rank <= 3 ? "bg-primary/5" : ""}`}>
                            <td className="py-3.5">
                              <div className="flex items-center gap-1.5">
                                {user.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
                                {user.rank === 2 && <Medal className="h-5 w-5 text-slate-400" />}
                                {user.rank === 3 && <Medal className="h-5 w-5 text-amber-600" />}
                                {(user.rank > 3 || !user.rank) && (
                                  <span className="font-mono text-sm font-semibold text-muted-foreground w-6 text-center">
                                    {user.rank ?? idx + 1}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5">
                              <div>
                                <p className="font-semibold text-sm">{user.name ?? "—"}</p>
                                <p className="text-xs text-muted-foreground md:hidden">{user.bojId ?? "—"}</p>
                              </div>
                            </td>
                            <td className="py-3.5 hidden md:table-cell">
                              {user.bojId ? (
                                <a href={`https://www.acmicpc.net/user/${user.bojId}`} target="_blank" rel="noreferrer"
                                  className="font-mono text-sm text-muted-foreground hover:text-primary hover:underline">
                                  {user.bojId}
                                </a>
                              ) : <span className="text-sm text-muted-foreground">—</span>}
                            </td>
                            <td className="py-3.5 hidden lg:table-cell">
                              <span className="text-sm text-muted-foreground">{user.department ?? "—"}</span>
                            </td>
                            <td className="py-3.5 hidden lg:table-cell">
                              <span className="text-sm text-muted-foreground">{user.grade ? `${user.grade}학년` : "—"}</span>
                            </td>
                            <td className="py-3.5 text-right hidden sm:table-cell">
                              <span className="font-mono text-sm text-muted-foreground">{user.solvedCount ?? 0}문제</span>
                            </td>
                            <td className="py-3.5 text-right">
                              <span className="font-mono text-lg font-bold">{user.totalPoints ?? 0}</span>
                              <span className="text-xs text-muted-foreground ml-0.5">점</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hasNext && (
                    <div className="mt-6 text-center">
                      <Button variant="outline" onClick={() => { const next = page + 1; setPage(next); fetchData(challengeId, next) }} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        더 보기
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
