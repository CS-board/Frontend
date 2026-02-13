"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Trophy, Target, Calendar, Loader2 } from "lucide-react"
import { recordService } from "@/services/record"
import { TOKEN_KEY } from "@/constants"
import type { MyProgressSummary, MyRecordSummary, MyRecordWeekItem, DailySolvedProblem } from "@/types"

const LEVEL_LABELS: Record<number, string> = {
  1: "브론즈 V", 2: "브론즈 IV", 3: "브론즈 III", 4: "브론즈 II", 5: "브론즈 I",
  6: "실버 V", 7: "실버 IV", 8: "실버 III", 9: "실버 II", 10: "실버 I",
  11: "골드 V", 12: "골드 IV", 13: "골드 III", 14: "골드 II", 15: "골드 I",
  16: "플래티넘 V", 17: "플래티넘 IV", 18: "플래티넘 III", 19: "플래티넘 II", 20: "플래티넘 I",
  21: "다이아 V", 22: "다이아 IV", 23: "다이아 III", 24: "다이아 II", 25: "다이아 I",
  26: "루비", 27: "루비", 28: "루비", 29: "루비", 30: "루비",
}
const TIER_SCORES: Record<number, number> = {
  1:1,2:2,3:3,4:4,5:5,6:8,7:10,8:12,9:14,10:16,
  11:22,12:25,13:28,14:31,15:35,16:45,17:50,18:55,19:60,20:65,
  21:80,22:90,23:100,24:110,25:120,26:150,27:150,28:150,29:150,30:150,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
}
function toYYYYMMDD(d: Date) {
  return d.toISOString().split("T")[0]
}
function getWeekDays(startAt: string) {
  const start = new Date(startAt)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"]

export default function MyRecordPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<MyProgressSummary | null>(null)
  const [summary, setSummary] = useState<MyRecordSummary | null>(null)
  const [weeks, setWeeks] = useState<MyRecordWeekItem[]>([])
  const [currentChallenge, setCurrentChallenge] = useState<MyRecordWeekItem | null>(null)
  const [dailySolved, setDailySolved] = useState<Record<string, DailySolvedProblem[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      router.replace("/login")
      return
    }
    async function load() {
      try {
        const [rec, w] = await Promise.all([
          recordService.getSummary(),
          recordService.getWeeks(0, 10),
        ])
        setSummary(rec)
        setWeeks(w.items)

        if (w.items.length > 0) {
          const current = w.items[0]
          setCurrentChallenge(current)

          const prog = await recordService.getProgressSummary(current.challengeId)
          setProgress(prog)

          const days = getWeekDays(current.startAt)
          const today = new Date()
          const pastDays = days.filter(d => d <= today)
          const entries = await Promise.all(
            pastDays.map(d => recordService.getDailySolved(current.challengeId, toYYYYMMDD(d))
              .then(r => [toYYYYMMDD(d), r.items] as [string, DailySolvedProblem[]])
              .catch(() => [toYYYYMMDD(d), []] as [string, DailySolvedProblem[]]))
          )
          setDailySolved(Object.fromEntries(entries))
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const achievementPct = progress ? Math.round(progress.achievementRate * 100) : 0
  const weekDays = currentChallenge ? getWeekDays(currentChallenge.startAt) : []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="CHIP_SAT" width={32} height={32} className="rounded-lg" />
          <span className="font-mono text-lg font-bold text-foreground">CHIP_SAT</span>
        </div>
        <MobileMenu />
      </header>

      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-balance">내 기록</h1>
              <p className="text-muted-foreground mt-2">이번 주 진행 상황과 활동 내역을 확인하세요</p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive text-center">
                {error} — 로그인이 필요합니다.
              </div>
            )}

            {/* Current Challenge Status */}
            {currentChallenge && progress && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2 font-mono">현재 진행 중</Badge>
                      <CardTitle className="text-2xl">{currentChallenge.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="font-mono text-lg px-4 py-2">
                      {Math.ceil((new Date(currentChallenge.endAt).getTime() - Date.now()) / 86400000)}일 남음
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatDate(currentChallenge.startAt)} – {formatDate(currentChallenge.endAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{progress.currentRank}위</p>
                        <p className="text-sm text-muted-foreground">현재 순위</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Target className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{progress.currentScore}</p>
                        <p className="text-sm text-muted-foreground">현재 점수</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          +{progress.scoreDelta}
                        </p>
                        <p className="text-sm text-muted-foreground">오늘 획득 점수</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">목표 달성률</span>
                      <span className="font-mono font-medium">{achievementPct}%</span>
                    </div>
                    <Progress value={achievementPct} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>0점</span>
                      <span>목표 {progress.goalScore}점</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Progress */}
            {currentChallenge && weekDays.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>일일 진행 상황</CardTitle>
                  <CardDescription>이번 주 날짜별 문제 풀이 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, i) => {
                      const key = toYYYYMMDD(day)
                      const items = dailySolved[key]
                      const solved = items?.length ?? null
                      const score = items?.reduce((s, p) => s + (TIER_SCORES[p.level] ?? 0), 0) ?? null
                      const isPast = day <= new Date()
                      const hasData = solved !== null
                      return (
                        <div key={i} className={`rounded-lg border p-3 text-center ${hasData && solved! > 0 ? "border-primary/50 bg-primary/10" : isPast ? "border-border bg-muted/30" : "border-dashed border-border bg-transparent opacity-50"}`}>
                          <p className="text-xs font-medium text-muted-foreground mb-2">{DAY_LABELS[i]}</p>
                          <p className="text-2xl font-bold font-mono">{hasData ? solved : "—"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{hasData ? `${score}점` : ""}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Solved Problems (today) */}
            {currentChallenge && (() => {
              const todayKey = toYYYYMMDD(new Date())
              const todayItems = dailySolved[todayKey]
              if (!todayItems || todayItems.length === 0) return null
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>오늘 해결한 문제</CardTitle>
                    <CardDescription>{todayItems.length}문제</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {todayItems.map((p) => (
                        <a key={p.problemId} href={`https://www.acmicpc.net/problem/${p.problemId}`} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-mono">{p.problemId}</Badge>
                            <span className="font-medium">{p.titleKo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{LEVEL_LABELS[p.level] ?? `Lv.${p.level}`}</Badge>
                            <span className="font-mono font-bold">{TIER_SCORES[p.level] ?? 0}점</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">참여 주차</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weeks.length}주</div>
                  <p className="text-xs text-muted-foreground">총 참여 횟수</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.maxPoints ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">역대 최고</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 해결 문제</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalSolvedCount ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">누적 문제 수</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly History */}
            {weeks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>주간 활동 내역</CardTitle>
                  <CardDescription>최근 참여한 챌린지 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weeks.map((w) => (
                      <div key={w.challengeId} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                            {w.rank}
                          </div>
                          <div>
                            <p className="font-medium font-mono">{w.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(w.startAt)} – {formatDate(w.endAt)} · {w.solvedCount}문제
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold font-mono">{w.score}</p>
                          <p className="text-sm text-muted-foreground">점</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
