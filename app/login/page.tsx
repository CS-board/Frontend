"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, ChevronLeft, Trophy, Target, Users, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/auth"
import { TOKEN_KEY } from "@/constants"

const loginSchema = z.object({
  username: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
})

type LoginFormData = z.infer<typeof loginSchema>

const features = [
  { icon: Trophy,  text: "매일 자동 집계되는 실시간 랭킹" },
  { icon: Target,  text: "백준 풀이 점수 자동 반영" },
  { icon: Users,   text: "CHIP_SAT 부원들과 함께 성장" },
  { icon: Zap,     text: "매일 밤 자정 순위 업데이트" },
]

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setSubmitError("")
    setSubmitting(true)
    try {
      const res = await authService.login(data)
      localStorage.setItem(TOKEN_KEY, res.token)
      // Schedule proactive AT refresh before expiry
      const { apiClient } = await import("@/api/client")
      apiClient.scheduleProactiveRefresh(res.token)
      router.push("/")
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "로그인에 실패했습니다. 다시 시도해주세요")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── 왼쪽 브랜딩 패널 ── */}
      <div
        className="hidden md:flex md:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 55%, #38bdf8 100%)" }}
      >
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-2xl" />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
        </div>

        {/* 로고 */}
        <Link href="/" className="relative z-10 flex items-center gap-3 w-fit group">
          <Image src="/logo.png" alt="CHIP_SAT" width={44} height={44} className="rounded-xl shadow-lg" />
          <div>
            <div className="font-mono text-xl font-bold text-white tracking-tight">CHIP_SAT</div>
            <div className="text-xs text-blue-100/80">주간 백준 챌린지</div>
          </div>
        </Link>

        {/* 메인 카피 */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            매일 성장하는<br />코딩 챌린지
          </h2>
          <p className="text-blue-100/80 text-lg mb-10">
            백준 문제를 풀고 자동으로 점수를 쌓으세요.<br />
            CHIP_SAT 부원들과 함께 성장합니다.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 */}
        <div className="relative z-10 text-blue-100/60 text-sm">
          CHIP_SAT © 2026 · 국립금오공과대학교 컴퓨터공학부
        </div>
      </div>

      {/* ── 오른쪽 폼 패널 ── */}
      <div className="flex flex-1 flex-col bg-background">
        {/* 홈으로 버튼 - 좌상단 고정 */}
        <div className="px-6 pt-6 md:px-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            홈으로
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 md:px-12">
        <div className="w-full max-w-sm">
          {/* 모바일용 로고 */}
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <Image src="/logo.png" alt="CHIP_SAT" width={40} height={40} className="rounded-xl" />
            <span className="font-mono text-xl font-bold">CHIP_SAT</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">로그인</h1>
            <p className="text-muted-foreground">백준 주간 챌린지에 참여하세요</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-semibold">웹메일</Label>
              <Input
                id="username"
                type="email"
                placeholder="your@kumoh.ac.kr"
                className="h-11"
                {...register("username")}
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="h-11 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {submitError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive text-center">
                {submitError}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              로그인
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">회원가입</Link>
            </p>
            <Link href="/forgot-password" className="block text-muted-foreground hover:text-foreground transition-colors">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
