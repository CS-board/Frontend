"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/services/auth"
import { TOKEN_KEY } from "@/constants"

const loginSchema = z.object({
  username: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
})

type LoginFormData = z.infer<typeof loginSchema>

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
      router.push("/")
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "로그인에 실패했습니다. 다시 시도해주세요")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-blue-400/5 blur-[80px]" />
      </div>

      <Link
        href="/"
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        홈으로
      </Link>

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4 group w-fit mx-auto">
            <Image src="/logo.png" alt="CHIP_SAT" width={48} height={48} className="rounded-lg" />
            <span className="font-mono text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
              CHIP_SAT
            </span>
          </Link>
          <CardTitle className="text-2xl text-center">로그인</CardTitle>
          <CardDescription className="text-center">백준 주간 챌린지에 참여하세요</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">웹메일</Label>
              <Input id="username" type="email" placeholder="your@kumoh.ac.kr" {...register("username")} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {submitError && (
              <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md p-2">
                {submitError}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              로그인
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">회원가입</Link>
          </div>
          <div className="text-center text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
