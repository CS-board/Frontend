"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/features/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Calendar, Target, Users, CheckCircle2, Trophy } from "lucide-react"
import Link from "next/link"
import { challengeService } from "@/services/challenge"
import { useAuth } from "@/hooks/use-auth"
import type { ChallengeDetails } from "@/types"

const tierGroups = [
  { name: "Bronze",   tiers: [{ label: "V", score: 1 }, { label: "IV", score: 2 }, { label: "III", score: 3 }, { label: "II", score: 4 }, { label: "I", score: 5 }] },
  { name: "Silver",   tiers: [{ label: "V", score: 8 }, { label: "IV", score: 10 }, { label: "III", score: 12 }, { label: "II", score: 14 }, { label: "I", score: 16 }] },
  { name: "Gold",     tiers: [{ label: "V", score: 22 }, { label: "IV", score: 25 }, { label: "III", score: 28 }, { label: "II", score: 31 }, { label: "I", score: 35 }] },
  { name: "Platinum", tiers: [{ label: "V", score: 45 }, { label: "IV", score: 50 }, { label: "III", score: 55 }, { label: "II", score: 60 }, { label: "I", score: 65 }] },
  { name: "Diamond",  tiers: [{ label: "V", score: 80 }, { label: "IV", score: 90 }, { label: "III", score: 100 }, { label: "II", score: 110 }, { label: "I", score: 120 }] },
  { name: "Ruby",     tiers: [{ label: "26~30", score: 150 }] },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })
}

export function DesktopHome() {
  const { isLoggedIn } = useAuth()
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null)

  useEffect(() => {
    challengeService.getDetails(1).then(setChallenge).catch(() => null)
  }, [])

  const ctaHref = isLoggedIn ? "/my-record" : "/login"
  const weekLabel = challenge?.title ?? "Week 1 • 2025"
  const dateRange = challenge
    ? `${formatDate(challenge.startAt)} – ${formatDate(challenge.endAt)}`
    : null
  const statusLabel = challenge?.status === "ACTIVE" ? "진행중"
    : challenge?.status === "SCHEDULED" ? "예정"
    : challenge?.status === "CLOSED" ? "종료" : "진행중"

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div className="mx-auto max-w-6xl px-8 py-16">
            <div className="flex items-center justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-block rounded-full border border-border bg-muted px-4 py-1.5">
                  <span className="font-mono text-sm text-muted-foreground">{weekLabel}</span>
                </div>

                <h1 className="mb-4 font-mono text-5xl font-bold leading-tight tracking-tighter text-foreground">
                  매일 성장하는
                  <br />
                  코딩 챌린지
                </h1>

                <p className="mb-6 text-lg text-muted-foreground">
                  금오공대 학생들을 위한 백준 주간 챌린지에 참여하세요.
                  <br />
                  매일 문제를 풀고 랭킹을 확인하며 함께 성장해요.
                </p>

                <div className="flex items-center gap-4">
                  <Link href={ctaHref}>
                    <Button size="lg" className="font-mono group">
                      {isLoggedIn ? "내 기록 보기" : "주간 챌린지 시작하기"}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/ranking">
                    <Button size="lg" variant="outline" className="font-mono bg-transparent">
                      랭킹 보기
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <div className="font-mono text-3xl font-bold text-foreground">
                      {challenge?.participantsCount ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">참여자</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <div className="font-mono text-3xl font-bold text-foreground">
                      {challenge?.totalSolvedCount != null
                        ? challenge.totalSolvedCount.toLocaleString()
                        : "—"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">해결 문제</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <div className="font-mono text-3xl font-bold text-foreground">
                      {challenge?.totalUserCount ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">전체 회원</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <div className="font-mono text-3xl font-bold text-foreground">
                      {dateRange ?? "1주일"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">챌린지 기간</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 -z-10 opacity-[0.03]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
                backgroundSize: "48px 48px",
              }}
            />
          </div>
        </section>

        {/* How to Participate */}
        <section className="border-b border-border bg-muted/30 px-8 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-center font-mono text-2xl font-bold text-foreground">참여 방법</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-mono text-lg">1. 회원가입</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    금오공대 웹메일로 인증하고 백준 아이디를 등록하세요
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-mono text-lg">2. 문제 풀기</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    매일 백준에서 문제를 풀면 자동으로 점수가 반영돼요
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-mono text-lg">3. 랭킹 확인</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    매일 밤 자정에 랭킹이 갱신되고 내 순위를 확인할 수 있어요
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Challenge Schedule */}
        <section className="border-b border-border bg-background px-8 py-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-center font-mono text-2xl font-bold text-foreground">챌린지 일정</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border">
                <CardContent className="flex items-center gap-4 p-6">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">랭킹 갱신 시간</div>
                    <div className="font-mono text-xl font-bold text-foreground">매일 밤 자정</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="flex items-center gap-4 p-6">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">챌린지 기간</div>
                    <div className="font-mono text-xl font-bold text-foreground">1주일 단위</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="flex items-center gap-4 p-6">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">현재 상태</div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      {weekLabel} {statusLabel}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Scoring System */}
        <section className="px-8 py-12 bg-muted/20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="font-mono text-2xl font-bold text-foreground mb-2">점수 가산 방식</h2>
              <p className="text-muted-foreground text-sm">
                백준 문제의 티어에 따라 아래 점수가 자동으로 반영됩니다
              </p>
            </div>

            <Card className="border-border overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-border">
                {tierGroups.map((group, gi) => (
                  <div key={group.name} className={gi >= 3 ? "border-t border-border" : ""}>
                    <div className="px-5 pt-4 pb-1">
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.name}
                      </p>
                    </div>
                    <table className="w-full">
                      <tbody>
                        {group.tiers.map((tier) => (
                          <tr key={tier.label} className="border-t border-border/50 first:border-0">
                            <td className="px-5 py-2 text-sm text-foreground/70">
                              {group.name} {tier.label}
                            </td>
                            <td className="px-5 py-2 text-right font-mono text-sm font-bold text-foreground">
                              {tier.score}점
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </Card>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              * 같은 날 여러 문제를 풀면 모든 점수가 합산됩니다 · 랭킹은 매일 밤 자정에 갱신됩니다
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
