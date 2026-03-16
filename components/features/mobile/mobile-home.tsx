"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronDown, MessageSquare, Calendar, Sparkles, Clock, Target } from "lucide-react"
import { Footer } from "@/components/features/footer"
import { useEffect, useState } from "react"
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

export function MobileHome() {
  const [scrollY, setScrollY] = useState(0)
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null)
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    challengeService.getDetails(1).then(setChallenge).catch(() => null)
  }, [])

  const section1Opacity = Math.max(0, 1 - scrollY / 400)
  const section2Opacity = Math.max(0, Math.min(1, (scrollY - 300) / 400))
  const section3Opacity = Math.max(0, Math.min(1, (scrollY - 700) / 400))
  const section4Opacity = Math.max(0, Math.min(1, (scrollY - 1100) / 400))
  const section5Opacity = Math.max(0, Math.min(1, (scrollY - 1500) / 400))

  const ctaHref = isLoggedIn ? "/my-record" : "/login"
  const weekLabel = challenge?.title ?? "Season 1 • 2026"

  return (
    <div className="min-h-screen bg-background">
      {/* Section 1: Hero */}
      <section
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ opacity: section1Opacity }}
      >
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-950/30">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm text-primary">{weekLabel}</span>
        </div>

        <h1 className="mb-6 font-mono text-5xl font-bold leading-tight text-foreground">
          이번 주<br />
          백준 챌린지
        </h1>

        <p className="mb-4 text-lg text-muted-foreground">CHIP_SAT 부원들을 위한</p>
        <p className="mb-16 text-lg text-muted-foreground">주간 코딩 챌린지</p>

        <div className="mb-16 flex gap-8">
          <div>
            <div className="font-mono text-3xl font-bold text-foreground">
              {challenge?.participantsCount ?? "—"}
            </div>
            <div className="text-sm text-muted-foreground">참여자</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div>
            <div className="font-mono text-3xl font-bold text-foreground">
              {challenge?.totalSolvedCount != null
                ? challenge.totalSolvedCount.toLocaleString()
                : "—"}
            </div>
            <div className="text-sm text-muted-foreground">문제 풀이</div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </div>
      </section>

      {/* Section 2: Challenge Info */}
      <section
        className="flex min-h-screen flex-col items-center justify-center px-6"
        style={{ opacity: section2Opacity }}
      >
        <Badge variant="outline" className="mb-8 font-mono">챌린지 안내</Badge>
        <h2 className="mb-6 font-mono text-4xl font-bold text-foreground">
          어떻게<br />참여하나요?
        </h2>

        <div className="w-full max-w-sm space-y-8">
          {[
            { n: "1", title: "회원가입", desc: "금오공대 웹메일로 인증하고 백준 아이디를 등록하세요" },
            { n: "2", title: "문제 풀기", desc: "매일 백준에서 문제를 풀면 자동으로 점수가 반영돼요" },
            { n: "3", title: "랭킹 확인", desc: "매일 밤 자정에 랭킹이 갱신되고 내 순위를 확인할 수 있어요" },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <span className="font-mono text-xl font-bold">{n}</span>
              </div>
              <div>
                <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Schedule */}
      <section
        className="flex min-h-screen flex-col items-center justify-center px-6"
        style={{ opacity: section3Opacity }}
      >
        <Badge variant="outline" className="mb-8 font-mono">챌린지 일정</Badge>
        <h2 className="mb-12 font-mono text-4xl font-bold text-center text-foreground">
          {weekLabel}<br />챌린지 진행 중
        </h2>

        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6">
            <Clock className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">랭킹 갱신 시간</div>
              <div className="font-mono text-xl font-bold text-foreground">매일 밤 자정</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6">
            <Calendar className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">챌린지 기간</div>
              <div className="font-mono text-xl font-bold text-foreground">1주일 단위</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6">
            <Target className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">목표</div>
              <div className="font-mono text-xl font-bold text-foreground">꾸준한 성장</div>
            </div>
          </div>
        </div>

        <Link href={ctaHref} className="mt-12">
          <Button size="lg" className="font-mono text-base">
            지금 시작하기
          </Button>
        </Link>
      </section>

      {/* Section 4: Scoring System */}
      <section className="min-h-screen px-6 py-20" style={{ opacity: section4Opacity }}>
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-6 font-mono">점수 가산 방식</Badge>
          <h2 className="font-mono text-4xl font-bold text-foreground">How Scoring Works</h2>
          <p className="mt-4 text-sm text-muted-foreground">티어별 점수를 확인하세요</p>
        </div>

        <div className="mx-auto max-w-md rounded-xl border border-border overflow-hidden">
          {tierGroups.map((group, gi) => (
            <div key={group.name} className={gi > 0 ? "border-t border-border" : ""}>
              <div className="px-4 pt-3 pb-1">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.name}
                </p>
              </div>
              <table className="w-full">
                <tbody>
                  {group.tiers.map((tier) => (
                    <tr key={tier.label} className="border-t border-border/40">
                      <td className="px-4 py-1.5 text-xs text-foreground/70">{group.name} {tier.label}</td>
                      <td className="px-4 py-1.5 text-right font-mono text-xs font-bold">{tier.score}점</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          * 하루에 푼 문제의 점수가 모두 합산됩니다
        </p>
      </section>

      {/* Section 5: Community */}
      <section className="min-h-screen px-6 py-20" style={{ opacity: section5Opacity }}>
        <div className="mx-auto max-w-md space-y-8 text-center">
          <Badge variant="outline" className="mb-6 font-mono">커뮤니티</Badge>

          <h2 className="font-mono text-4xl font-bold leading-tight text-foreground">
            함께 성장하는<br />커뮤니티
          </h2>

          <p className="text-lg text-muted-foreground">질문하고, 공유하고, 함께 배워요</p>

          <div className="space-y-4 pt-8">
            <Link href="/qna" className="block">
              <Button size="lg" variant="outline"
                className="group h-20 w-full justify-start gap-4 border-2 text-left font-mono transition-all hover:border-primary hover:bg-primary/5 bg-transparent">
                <MessageSquare className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                <div>
                  <div className="text-base font-semibold text-foreground">Q&A 게시판</div>
                  <div className="text-sm text-muted-foreground">백준 문제 질문하기</div>
                </div>
              </Button>
            </Link>

            <Link href="/board" className="block">
              <Button size="lg" variant="outline"
                className="group h-20 w-full justify-start gap-4 border-2 text-left font-mono transition-all hover:border-primary hover:bg-primary/5 bg-transparent">
                <Calendar className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                <div>
                  <div className="text-base font-semibold text-foreground">게시판</div>
                  <div className="text-sm text-muted-foreground">공지사항 및 안내</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <Footer />
      </section>
    </div>
  )
}
