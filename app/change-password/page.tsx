"use client"

/** 로그인 사용자 비밀번호 변경 — 이메일 인증 후 재설정(forgot-password와 동일 API) */
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Loader2, ChevronLeft, CheckCircle2, Eye, EyeOff,
  ShieldCheck, KeyRound, LockKeyhole, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/auth"
import { userService } from "@/services/user"
import { TOKEN_KEY } from "@/constants"

type Step = "confirm" | "sending" | "code" | "verifying" | "password" | "done"

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#$%^&*()_+?])[A-Za-z\d@!#$%^&*()_+?]{10,20}$/

const changeSteps = [
  { icon: ShieldCheck, label: "이메일 인증",  desc: "등록된 이메일로 코드 전송" },
  { icon: KeyRound,    label: "코드 확인",    desc: "메일로 전송된 6자리 코드" },
  { icon: LockKeyhole, label: "비밀번호 변경", desc: "새 비밀번호 설정 후 완료" },
]

export default function ChangePasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<Step>("confirm")
  const [code, setCode] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      router.replace("/login")
      return
    }
    userService.getDetail()
      .then(d => setEmail(d.email))
      .catch(() => {
        try {
          const token = localStorage.getItem(TOKEN_KEY)!
          const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
          setEmail(payload.sub ?? "")
        } catch {/* ignore */}
      })
  }, [router])

  const stepIndex: Record<Step, number> = {
    confirm: 0, sending: 0, code: 1, verifying: 1, password: 2, done: 3,
  }

  const startCooldown = () => {
    setResendCooldown(60)
    const t = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(t); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendMail = async () => {
    if (!email) { setError("이메일 정보를 찾을 수 없습니다"); return }
    setLoading(true); setError(""); setStep("sending")
    try {
      await authService.sendPasswordResetMail(email)
      setStep("code")
      startCooldown()
    } catch (e) {
      setError(e instanceof Error ? e.message : "메일 전송에 실패했습니다")
      setStep("confirm")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) { setError("인증 코드를 입력해주세요"); return }
    setLoading(true); setError(""); setStep("verifying")
    try {
      await authService.verifyPasswordResetCode(email, code.trim())
      setStep("password")
    } catch (e) {
      setError(e instanceof Error ? e.message : "코드가 올바르지 않습니다")
      setStep("code")
    } finally {
      setLoading(false)
    }
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      <div
        className="hidden md:flex md:w-[45%] flex-col justify-between p-12 sticky top-0 h-screen overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 55%, #38bdf8 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-2xl" />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
        </div>

        <Link href="/settings" className="relative z-10 flex items-center gap-3 w-fit">
          <Image src="/logo.png" alt="CHIP_SAT" width={44} height={44} className="rounded-xl shadow-lg" />
          <div>
            <div className="font-mono text-xl font-bold text-white tracking-tight">CHIP_SAT</div>
            <div className="text-xs text-blue-100/80">주간 백준 챌린지</div>
          </div>
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            비밀번호<br />변경
          </h2>
          <p className="text-blue-100/80 text-lg mb-10">
            3단계만 완료하면<br />
            새 비밀번호로 로그인할 수 있어요.
          </p>
          <div className="space-y-5">
            {changeSteps.map(({ icon: Icon, label, desc }, i) => {
              const current = stepIndex[step]
              const done = i < current
              const active = i === current && step !== "done"
              return (
                <div key={label} className="flex items-center gap-4">
                  <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl backdrop-blur-sm transition-all
                    ${done || step === "done" ? "bg-white/30" : active ? "bg-white/20 ring-2 ring-white/50" : "bg-white/10"}`}>
                    {done || step === "done"
                      ? <CheckCircle2 className="h-5 w-5 text-white" />
                      : <Icon className="h-5 w-5 text-white" />
                    }
                    <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow
                      ${done || step === "done" ? "bg-white/60 text-blue-700" : active ? "bg-white text-blue-600" : "bg-white/30 text-white"}`}>
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <div className={`font-semibold text-sm transition-all ${active ? "text-white" : "text-white/60"}`}>
                      {label}
                    </div>
                    <div className="text-blue-100/70 text-xs">{desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 text-blue-100/60 text-sm">
          CHIP_SAT © 2026 · 국립금오공과대학교 컴퓨터공학부
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-background">
        <div className="px-6 pt-6 md:px-12">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            설정으로 돌아가기
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 md:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <Image src="/logo.png" alt="CHIP_SAT" width={40} height={40} className="rounded-xl" />
              <span className="font-mono text-xl font-bold">CHIP_SAT</span>
            </div>

            {(step === "confirm" || step === "sending") && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">비밀번호 변경</h1>
                  <p className="text-muted-foreground">
                    아래 이메일로 인증 코드를 발송합니다
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3.5">
                  <p className="text-xs text-muted-foreground mb-0.5">인증 메일 수신 주소</p>
                  <p className="font-medium text-foreground truncate">{email || "불러오는 중..."}</p>
                </div>
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3 flex-shrink-0" />{error}
                  </p>
                )}
                <Button
                  className="w-full h-11 text-base font-semibold"
                  onClick={handleSendMail}
                  disabled={loading || !email}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  인증 코드 전송
                </Button>
              </div>
            )}

            {(step === "code" || step === "verifying") && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">인증코드 확인</h1>
                  <p className="text-muted-foreground text-sm">
                    <span className="font-medium text-foreground">{email}</span>으로 발송된 코드를 입력하세요
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-semibold">인증 코드</Label>
                  <Input
                    id="code"
                    placeholder="6자리 코드 입력"
                    className="h-11 font-mono text-base tracking-widest text-center"
                    value={code}
                    onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }}
                    maxLength={6}
                    autoFocus
                    disabled={step === "verifying"}
                  />
                </div>
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3 flex-shrink-0" />{error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loading || !code.trim() || step === "verifying"}
                >
                  {(loading || step === "verifying") && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  코드 확인
                </Button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSendMail}
                    disabled={resendCooldown > 0 || loading}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `재전송 (${resendCooldown}초)` : "코드 재전송"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("confirm"); setCode(""); setError("") }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    이전으로
                  </button>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">새 비밀번호 설정</h1>
                  <p className="text-muted-foreground">새 비밀번호를 입력해주세요</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPw" className="text-sm font-semibold">새 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="newPw"
                      type={showPw ? "text" : "password"}
                      className="h-11 pr-10"
                      placeholder="대소문자+숫자+특수문자, 10~20자"
                      value={newPw}
                      onChange={e => { setNewPw(e.target.value); setError("") }}
                      autoFocus
                      required
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPw && (
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {[
                        { label: "10~20자", ok: newPw.length >= 10 && newPw.length <= 20 },
                        { label: "소문자 포함", ok: /[a-z]/.test(newPw) },
                        { label: "대문자 포함", ok: /[A-Z]/.test(newPw) },
                        { label: "숫자 포함", ok: /\d/.test(newPw) },
                        { label: "특수문자 포함", ok: /[@!#$%^&*()_+?]/.test(newPw) },
                      ].map(({ label, ok }) => (
                        <div key={label} className={`flex items-center gap-1 text-xs ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPw" className="text-sm font-semibold">비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="confirmPw"
                      type={showConfirm ? "text" : "password"}
                      className={`h-11 pr-10 ${confirmPw ? (confirmPw === newPw ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                      placeholder="비밀번호 재입력"
                      value={confirmPw}
                      onChange={e => { setConfirmPw(e.target.value); setError("") }}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPw && (
                    <p className={`text-xs flex items-center gap-1 ${confirmPw === newPw ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {confirmPw === newPw
                        ? <><CheckCircle2 className="h-3 w-3" />비밀번호가 일치합니다</>
                        : <><XCircle className="h-3 w-3" />비밀번호가 일치하지 않습니다</>
                      }
                    </p>
                  )}
                </div>
                {error && <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" />{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loading || !newPw || !confirmPw || newPw !== confirmPw}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  비밀번호 변경 완료
                </Button>
              </form>
            )}

            {step === "done" && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">변경 완료</h1>
                  <p className="text-muted-foreground">비밀번호가 성공적으로 변경되었습니다.</p>
                </div>
                <Button className="w-full h-11 text-base font-semibold" onClick={() => router.push("/settings")}>
                  설정으로 돌아가기
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
