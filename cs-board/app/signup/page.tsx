"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Eye, EyeOff, ChevronLeft, ClipboardList, ShieldCheck, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { authService } from "@/services/auth"

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#$%^&*()_+?])[A-Za-z\d@!#$%^&*()_+?]{10,20}$/
const STUDENT_ID_REGEX = /^(\d{8}|\d{10})$/

const signupSchema = z
  .object({
    name: z.string().min(1, "이름을 입력해주세요"),
    studentId: z.string().regex(STUDENT_ID_REGEX, "학번은 8자리 또는 10자리 숫자입니다"),
    username: z
      .string()
      .email("올바른 이메일 형식이 아닙니다")
      .refine((v) => v.endsWith("@kumoh.ac.kr"), "@kumoh.ac.kr 메일만 사용 가능합니다"),
    bojId: z.string().min(1, "백준 ID를 입력해주세요"),
    password: z
      .string()
      .regex(PASSWORD_REGEX, "영문 대소문자·숫자·특수문자(@!#$%^&*()_+?)를 모두 포함, 10~20자"),
    confirmPassword: z.string(),
    department: z.string().min(1, "학과를 선택해주세요"),
    grade: z.string().min(1, "학년을 선택해주세요"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  })

type SignupFormData = z.infer<typeof signupSchema>

const steps = [
  { icon: ClipboardList, label: "기본 정보 입력", desc: "이름, 학번, 학과, 학년" },
  { icon: ShieldCheck,   label: "메일·백준 인증", desc: "웹메일 및 백준 ID 확인" },
  { icon: LogIn,         label: "챌린지 참여",    desc: "로그인 후 바로 시작" },
]

export default function SignupPage() {
  const router = useRouter()

  const [departments, setDepartments] = useState<string[]>([])
  const [loadingDepts, setLoadingDepts] = useState(true)

  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [emailCode, setEmailCode] = useState("")
  const [emailVerified, setEmailVerified] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [emailError, setEmailError] = useState("")

  const [baekjoonVerified, setBaekjoonVerified] = useState(false)
  const [verifyingBaekjoon, setVerifyingBaekjoon] = useState(false)
  const [baekjoonError, setBaekjoonError] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const {
    register, handleSubmit, formState: { errors }, watch, getValues, setValue,
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) })

  const usernameValue = watch("username")
  const bojIdValue = watch("bojId")

  useEffect(() => {
    setEmailVerified(false); setEmailCodeSent(false); setEmailCode(""); setEmailError("")
  }, [usernameValue])

  useEffect(() => {
    setBaekjoonVerified(false); setBaekjoonError("")
  }, [bojIdValue])

  useEffect(() => {
    authService.getDepartments()
      .then(setDepartments)
      .catch((e) => {
        console.error("[학과 목록 로드 실패]", e)
        setDepartments([])
      })
      .finally(() => setLoadingDepts(false))
  }, [])

  async function handleSendEmailCode() {
    setEmailError(""); setSendingCode(true)
    try {
      await authService.sendEmailVerification(getValues("username"))
      setEmailCodeSent(true)
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "인증코드 전송에 실패했습니다")
    } finally { setSendingCode(false) }
  }

  async function handleVerifyEmail() {
    setEmailError(""); setVerifyingEmail(true)
    try {
      const code = parseInt(emailCode, 10)
      if (isNaN(code)) { setEmailError("숫자로 된 인증코드를 입력해주세요"); return }
      await authService.verifyEmailCode(getValues("username"), code)
      setEmailVerified(true)
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "인증에 실패했습니다. 코드를 확인해주세요")
    } finally { setVerifyingEmail(false) }
  }

  async function handleVerifyBaekjoon() {
    setBaekjoonError(""); setVerifyingBaekjoon(true)
    try {
      const valid = await authService.validateBaekjoon(getValues("bojId"))
      if (valid) setBaekjoonVerified(true)
      else setBaekjoonError("유효하지 않은 백준 아이디입니다")
    } catch (e) {
      setBaekjoonError(e instanceof Error ? e.message : "백준 ID 인증에 실패했습니다")
    } finally { setVerifyingBaekjoon(false) }
  }

  async function onSubmit(data: SignupFormData) {
    if (!emailVerified) { setEmailError("웹메일 인증을 완료해주세요"); return }
    if (!baekjoonVerified) { setBaekjoonError("백준 ID 인증을 완료해주세요"); return }
    setSubmitError(""); setSubmitting(true)
    try {
      await authService.signup({
        username: data.username, password: data.password, name: data.name,
        department: data.department, studentId: data.studentId,
        grade: parseInt(data.grade), bojId: data.bojId,
      })
      router.push("/login")
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "회원가입에 실패했습니다. 다시 시도해주세요")
    } finally { setSubmitting(false) }
  }

  const isEmailValid = usernameValue?.endsWith("@kumoh.ac.kr")

  return (
    <div className="flex min-h-screen">

      {/* ── 왼쪽 브랜딩 패널 ── */}
      <div
        className="hidden md:flex md:w-[45%] flex-col justify-between p-12 sticky top-0 h-screen overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 55%, #38bdf8 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-3 w-fit">
          <Image src="/logo.png" alt="CHIP_SAT" width={44} height={44} className="rounded-xl shadow-lg" />
          <div>
            <div className="font-mono text-xl font-bold text-white tracking-tight">CHIP_SAT</div>
            <div className="text-xs text-blue-100/80">주간 코테 챌린지</div>
          </div>
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            3분이면<br />가입 완료
          </h2>
          <p className="text-blue-100/80 text-lg mb-10">
            간단한 정보 입력과 인증만으로<br />
            챌린지에 바로 참여할 수 있어요.
          </p>
          <div className="space-y-5">
            {steps.map(({ icon: Icon, label, desc }, i) => (
              <div key={label} className="flex items-center gap-4">
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 text-[10px] font-bold shadow">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{label}</div>
                  <div className="text-blue-100/70 text-xs">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-blue-100/60 text-sm">
          CHIP_SAT © 2026 · 국립금오공과대학교 컴퓨터공학부
        </div>
      </div>

      {/* ── 오른쪽 폼 패널 ── */}
      <div className="flex flex-1 flex-col bg-background overflow-y-auto">
        {/* 로그인으로 버튼 - 좌상단 고정 */}
        <div className="px-6 pt-6 md:px-12">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            로그인으로
          </Link>
        </div>

        <div className="flex flex-col items-center px-6 py-8 md:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <Image src="/logo.png" alt="CHIP_SAT" width={40} height={40} className="rounded-xl" />
              <span className="font-mono text-xl font-bold">CHIP_SAT</span>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">회원가입</h1>
              <p className="text-muted-foreground">정보를 입력하고 챌린지에 참여하세요</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 이름 */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold">이름</Label>
                <Input id="name" placeholder="홍길동" className="h-11" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* 학번 */}
              <div className="space-y-1.5">
                <Label htmlFor="studentId" className="text-sm font-semibold">학번</Label>
                <Input id="studentId" placeholder="21000000" className="h-11" {...register("studentId")} />
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>

              {/* 웹메일 + 인증 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold">웹메일</Label>
                <div className="flex gap-2">
                  <Input
                    id="username" type="email" placeholder="your@kumoh.ac.kr"
                    className="h-11 flex-1"
                    {...register("username")} disabled={emailVerified}
                  />
                  {emailVerified ? (
                    <Badge variant="outline" className="flex items-center gap-1 px-3 shrink-0 text-green-600 border-green-600 bg-green-50 dark:bg-green-950">
                      <CheckCircle2 className="h-3.5 w-3.5" />인증완료
                    </Badge>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={handleSendEmailCode}
                      disabled={sendingCode || !isEmailValid}
                      className="shrink-0 h-11 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100">
                      {sendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : emailCodeSent ? "재전송" : "인증코드 전송"}
                    </Button>
                  )}
                </div>
                {!errors.username && <p className="text-xs text-muted-foreground">@kumoh.ac.kr 메일만 사용 가능합니다</p>}
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                {emailCodeSent && !emailVerified && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="인증 코드 입력" value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                      maxLength={10} inputMode="numeric" className="h-11 flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleVerifyEmail}
                      disabled={verifyingEmail || emailCode.length === 0}
                      className="shrink-0 h-11 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100">
                      {verifyingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "인증 확인"}
                    </Button>
                  </div>
                )}
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>

              {/* 백준 ID + 인증 */}
              <div className="space-y-1.5">
                <Label htmlFor="bojId" className="text-sm font-semibold">백준 ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="bojId" placeholder="백준 아이디"
                    className="h-11 flex-1"
                    {...register("bojId")} disabled={baekjoonVerified}
                  />
                  {baekjoonVerified ? (
                    <Badge variant="outline" className="flex items-center gap-1 px-3 shrink-0 text-green-600 border-green-600 bg-green-50 dark:bg-green-950">
                      <CheckCircle2 className="h-3.5 w-3.5" />인증완료
                    </Badge>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={handleVerifyBaekjoon}
                      disabled={verifyingBaekjoon || !bojIdValue}
                      className="shrink-0 h-11 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100">
                      {verifyingBaekjoon ? <Loader2 className="h-4 w-4 animate-spin" /> : "인증"}
                    </Button>
                  )}
                </div>
                {errors.bojId && <p className="text-xs text-destructive">{errors.bojId.message}</p>}
                {baekjoonError && <p className="text-xs text-destructive">{baekjoonError}</p>}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password" type={showPassword ? "text" : "password"}
                    placeholder="대소문자+숫자+특수문자, 10~20자"
                    className="h-11 pr-10" {...register("password")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호 재입력"
                    className="h-11 pr-10" {...register("confirmPassword")}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              {/* 학과 */}
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-sm font-semibold">학과</Label>
                <Select onValueChange={(val) => setValue("department", val, { shouldValidate: true })}>
                  <SelectTrigger id="department" className="h-11">
                    <SelectValue placeholder={loadingDepts ? "불러오는 중..." : "학과 선택"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
              </div>

              {/* 학년 */}
              <div className="space-y-1.5">
                <Label htmlFor="grade" className="text-sm font-semibold">학년</Label>
                <Select onValueChange={(val) => setValue("grade", val, { shouldValidate: true })}>
                  <SelectTrigger id="grade" className="h-11">
                    <SelectValue placeholder="학년 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((g) => (
                      <SelectItem key={g} value={String(g)}>{g}학년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
              </div>

              {submitError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive text-center">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                회원가입
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">로그인</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
