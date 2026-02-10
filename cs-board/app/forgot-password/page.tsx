"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ChevronLeft, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/services/auth"

type Step = "email" | "code" | "password" | "done"
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#$%^&*()_+?])[A-Za-z\d@!#$%^&*()_+?]{10,20}$/

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.endsWith("@kumoh.ac.kr")) { setError("@kumoh.ac.kr 메일만 사용 가능합니다"); return }
    setLoading(true); setError("")
    try {
      await authService.sendPasswordResetMail(email)
      setStep("code")
    } catch (e) {
      setError(e instanceof Error ? e.message : "메일 전송에 실패했습니다")
    } finally { setLoading(false) }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) { setError("인증 코드를 입력해주세요"); return }
    setLoading(true); setError("")
    try {
      await authService.verifyPasswordResetCode(email, code.trim())
      setStep("password")
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증에 실패했습니다. 코드를 확인해주세요")
    } finally { setLoading(false) }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!PASSWORD_REGEX.test(newPw)) { setError("영문 대소문자·숫자·특수문자를 모두 포함, 10~20자"); return }
    if (newPw !== confirmPw) { setError("비밀번호가 일치하지 않습니다"); return }
    setLoading(true); setError("")
    try {
      await authService.resetPassword(email, newPw)
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "비밀번호 변경에 실패했습니다")
    } finally { setLoading(false) }
  }

  const stepTitles: Record<Step, string> = {
    email: "비밀번호 찾기", code: "인증 코드 확인",
    password: "새 비밀번호 설정", done: "변경 완료",
  }
  const stepDescs: Record<Step, string> = {
    email: "가입 시 등록한 웹메일을 입력하세요",
    code: `${email}으로 발송된 코드를 입력하세요`,
    password: "새 비밀번호를 입력하세요",
    done: "비밀번호가 성공적으로 변경되었습니다",
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <Link href="/login"
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
        <ChevronLeft className="h-4 w-4" />로그인으로
      </Link>

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4 group w-fit mx-auto">
            <Image src="/logo.png" alt="CHIP_SAT" width={48} height={48} className="rounded-lg" />
            <span className="font-mono text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">CHIP_SAT</span>
          </Link>
          <CardTitle className="text-2xl text-center">{stepTitles[step]}</CardTitle>
          <CardDescription className="text-center">{stepDescs[step]}</CardDescription>
        </CardHeader>

        <CardContent>
          {step === "email" && (
            <form onSubmit={handleSendMail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">웹메일</Label>
                <Input id="email" type="email" placeholder="your@kumoh.ac.kr"
                  value={email} onChange={e => { setEmail(e.target.value); setError("") }} required />
              </div>
              {error && <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md p-2">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading || !email}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}인증 메일 전송
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">인증 코드</Label>
                <Input id="code" placeholder="메일로 받은 코드 입력"
                  value={code} onChange={e => { setCode(e.target.value); setError("") }} required />
              </div>
              {error && <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md p-2">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading || !code.trim()}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}코드 확인
              </Button>
              <button type="button" onClick={() => { setStep("email"); setCode(""); setError("") }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                이메일 다시 입력
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPw">새 비밀번호</Label>
                <div className="relative">
                  <Input id="newPw" type={showPw ? "text" : "password"}
                    placeholder="대소문자+숫자+특수문자, 10~20자"
                    value={newPw} onChange={e => { setNewPw(e.target.value); setError("") }} className="pr-10" required />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPw">비밀번호 확인</Label>
                <div className="relative">
                  <Input id="confirmPw" type={showConfirm ? "text" : "password"}
                    placeholder="비밀번호 재입력"
                    value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setError("") }} className="pr-10" required />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md p-2">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading || !newPw || !confirmPw}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}비밀번호 변경
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground">새 비밀번호로 로그인할 수 있습니다.</p>
              <Button className="w-full" size="lg" onClick={() => router.push("/login")}>
                로그인 하러 가기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
