"use client"

/** 데스크톱 홈: 히어로·참여방법·일정·점수표(챌린지 id=1 요약은 API, 나머지 정적) */
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/features/sidebar"
import { Footer } from "@/components/features/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Calendar, Target, Users, CheckCircle2, Trophy, Hash } from "lucide-react"
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
  const weekLabel = challenge?.title ?? "Season 1 • 2026"
  const dateRange = challenge
    ? `${formatDate(challenge.startAt)} – ${formatDate(challenge.endAt)}`
    : null
  const statusLabel = challenge?.status === "ACTIVE" ? "진행중"
    : challenge?.status === "SCHEDULED" ? "예정"
    : challenge?.status === "CLOSED" ? "종료" : "진행중"

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        <div className="flex-1">
        <section className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 55%, #38bdf8 100%)" }}>
          {/* 배경 장식 */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-sky-300/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-300/15 blur-2xl" />
            <div className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          <div className="relative mx-auto max-w-6xl px-8 py-20">
            <div className="flex items-center justify-between gap-12">
              <div className="max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-mono text-sm text-white/90 font-medium">{weekLabel} · {statusLabel}</span>
                </div>

                <h1 className="mb-5 text-5xl font-bold leading-tight text-white" style={{ letterSpacing: "-0.03em" }}>
                  매일 성장하는<br />
                  <span className="text-sky-200">코딩 챌린지</span>
                </h1>

                <p className="mb-8 text-lg leading-relaxed text-blue-100/80">
                  CHIP_SAT 부원들을 위한 백준 주간 챌린지에 참여하세요.
                  <br />
                  매일 문제를 풀고 랭킹을 확인하며 함께 성장해요.
                </p>

                <div className="flex items-center gap-3">
                  <Link href={ctaHref}>
                    <Button size="lg" className="group bg-white text-primary hover:bg-indigo-50 font-semibold shadow-lg shadow-black/20">
                      {isLoggedIn ? "내 기록 보기" : "챌린지 시작하기"}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/ranking">
                    <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm font-semibold">
                      랭킹 보기
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {[
                  { icon: Users, label: "참여자", value: challenge?.participantsCount ?? "—" },
                  { icon: Target, label: "해결 문제", value: challenge?.totalSolvedCount != null ? challenge.totalSolvedCount.toLocaleString() : "—" },
                  { icon: Hash, label: "전체 회원", value: challenge?.totalUserCount ?? "—" },
                  { icon: Calendar, label: "챌린지 기간", value: dateRange ?? "1주일" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur-sm">
                    <div className="mb-2 flex justify-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="font-mono text-3xl font-bold text-white">{value}</div>
                    <div className="mt-1 text-sm text-sky-200">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/20 px-8 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">참여 방법</h2>
              <p className="text-muted-foreground">3단계로 간단하게 시작할 수 있어요</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { n: "01", icon: Users, title: "회원가입", desc: "금오공대 웹메일로 인증하고 백준 아이디를 등록하세요", color: "from-sky-400 to-blue-500" },
                { n: "02", icon: Target, title: "문제 풀기", desc: "매일 백준에서 문제를 풀면 자동으로 점수가 반영돼요", color: "from-blue-400 to-blue-600" },
                { n: "03", icon: Trophy, title: "랭킹 확인", desc: "매일 밤 자정에 랭킹이 갱신되고 내 순위를 확인할 수 있어요", color: "from-blue-500 to-sky-600" },
              ].map(({ n, icon: Icon, title, desc, color }) => (
                <Card key={n} className="group relative overflow-hidden border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {/* 상단 그라디언트 바 */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
                  <CardHeader className="pb-2 pt-7">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-mono text-5xl font-bold text-border group-hover:text-primary/20 transition-colors select-none">{n}</span>
                    </div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-8 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">챌린지 일정</h2>
              <p className="text-muted-foreground">자동 집계로 부담 없이 참여할 수 있어요</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30">
                    <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="mb-0.5 text-sm text-muted-foreground">랭킹 갱신 시간</div>
                    <div className="text-xl font-bold text-foreground">매일 밤 자정</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/30">
                    <Calendar className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <div className="mb-0.5 text-sm text-muted-foreground">챌린지 기간</div>
                    <div className="text-xl font-bold text-foreground">1주일 단위</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/30">
                    <CheckCircle2 className="h-7 w-7 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <div className="mb-0.5 text-sm text-muted-foreground">현재 상태</div>
                    <div className="text-xl font-bold text-foreground">
                      {statusLabel}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="px-8 py-16 bg-muted/20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold text-foreground">점수 가산 방식</h2>
              <p className="text-muted-foreground">
                백준 문제의 티어에 따라 점수가 자동으로 반영됩니다
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {tierGroups.map((group) => {
                const tierStyle: Record<string, { bg: string; badge: string; dot: string }> = {
                  Bronze:   { bg: "bg-amber-50 dark:bg-amber-950/20",   badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",   dot: "bg-amber-500" },
                  Silver:   { bg: "bg-slate-50 dark:bg-slate-900/30",   badge: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",   dot: "bg-slate-400" },
                  Gold:     { bg: "bg-yellow-50 dark:bg-yellow-950/20", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300", dot: "bg-yellow-500" },
                  Platinum: { bg: "bg-teal-50 dark:bg-teal-950/20",    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",        dot: "bg-teal-500" },
                  Diamond:  { bg: "bg-blue-50 dark:bg-blue-950/20",    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",         dot: "bg-blue-500" },
                  Ruby:     { bg: "bg-rose-50 dark:bg-rose-950/20",    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",         dot: "bg-rose-500" },
                }
                const s = tierStyle[group.name] ?? tierStyle.Bronze
                return (
                  <Card key={group.name} className={`overflow-hidden border-border/60 shadow-sm ${s.bg}`}>
                    <CardHeader className="pb-2 pt-5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                        <CardTitle className="text-base">{group.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-5">
                      <div className="space-y-1.5">
                        {group.tiers.map((tier) => (
                          <div key={tier.label} className="flex items-center justify-between">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${s.badge}`}>
                              {group.name} {tier.label}
                            </span>
                            <span className="font-mono text-sm font-bold text-foreground">{tier.score}점</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              * 같은 날 여러 문제를 풀면 모든 점수가 합산됩니다 · 랭킹은 매일 밤 자정에 갱신됩니다
            </p>
          </div>
        </section>
        </div>
        <Footer />
      </main>
    </div>
  )
}
