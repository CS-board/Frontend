import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function MainBanner() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-block rounded-full border border-border bg-muted px-4 py-1.5">
            <span className="font-mono text-sm text-muted-foreground">Season 1 • 2026</span>
          </div>

          <h1 className="mb-6 font-mono text-4xl font-bold leading-tight tracking-tighter text-foreground md:text-5xl lg:text-6xl text-balance">
            매일 성장하는 코딩 챌린지
          </h1>

          <p className="mb-8 text-lg text-muted-foreground md:text-xl text-pretty">
            금오공과대학교 컴퓨터공학부의 주간 백준 챌린지에 참여하세요.
            <br className="hidden md:block" />
            매일 문제를 풀고 랭킹을 확인하며 함께 성장해요.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full font-mono group">
                주간 챌린지 시작하기
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-mono bg-transparent">
              랭킹 보기
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 md:gap-8">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="font-mono text-2xl font-bold text-foreground md:text-3xl">142</div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">참여자</div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="font-mono text-2xl font-bold text-foreground md:text-3xl">1,247</div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">해결 문제</div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="font-mono text-2xl font-bold text-foreground md:text-3xl">8</div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">주차</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Grid */}
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
  )
}
