"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      .catch(() => setDepartments([]))
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
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-8">
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
          <CardTitle className="text-2xl text-center">회원가입</CardTitle>
          <CardDescription className="text-center">정보를 입력하고 챌린지에 참여하세요</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" placeholder="홍길동" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* 학번 */}
            <div className="space-y-2">
              <Label htmlFor="studentId">학번</Label>
              <Input id="studentId" placeholder="21000000" {...register("studentId")} />
              {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
            </div>

            {/* 웹메일 + 인증 */}
            <div className="space-y-2">
              <Label htmlFor="username">웹메일</Label>
              <div className="flex gap-2">
                <Input id="username" type="email" placeholder="your@kumoh.ac.kr" {...register("username")} disabled={emailVerified} className="flex-1" />
                {emailVerified ? (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 shrink-0 text-green-600 border-green-600 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-3.5 w-3.5" />인증완료
                  </Badge>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={handleSendEmailCode}
                    disabled={sendingCode || !isEmailValid}
                    className="shrink-0 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100">
                    {sendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : emailCodeSent ? "재전송" : "인증코드 전송"}
                  </Button>
                )}
              </div>
              {!errors.username && <p className="text-xs text-muted-foreground">@kumoh.ac.kr 메일만 사용 가능합니다</p>}
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              {emailCodeSent && !emailVerified && (
                <div className="flex gap-2">
                  <Input placeholder="인증 코드 입력" value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                    maxLength={10} inputMode="numeric" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={handleVerifyEmail}
                    disabled={verifyingEmail || emailCode.length === 0}
                    className="shrink-0 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100">
                    {verifyingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "인증 확인"}
                  </Button>
                </div>
              )}
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>

            {/* 백준 ID + 인증 */}
            <div className="space-y-2">
              <Label htmlFor="bojId">백준 ID</Label>
              <div className="flex gap-2">
                <Input id="bojId" placeholder="백준 아이디" {...register("bojId")} disabled={baekjoonVerified} className="flex-1" />
                {baekjoonVerified ? (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 shrink-0 text-green-600 border-green-600 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-3.5 w-3.5" />인증완료
                  </Badge>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={handleVerifyBaekjoon}
                    disabled={verifyingBaekjoon || !bojIdValue}
                    className="shrink-0 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100">
                    {verifyingBaekjoon ? <Loader2 className="h-4 w-4 animate-spin" /> : "인증"}
                  </Button>
                )}
              </div>
              {errors.bojId && <p className="text-xs text-destructive">{errors.bojId.message}</p>}
              {baekjoonError && <p className="text-xs text-destructive">{baekjoonError}</p>}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  placeholder="대소문자+숫자+특수문자, 10~20자" {...register("password")} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호 재입력" {...register("confirmPassword")} className="pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {/* 학과 */}
            <div className="space-y-2">
              <Label htmlFor="department">학과</Label>
              <Select onValueChange={(val) => setValue("department", val, { shouldValidate: true })}>
                <SelectTrigger id="department">
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
            <div className="space-y-2">
              <Label htmlFor="grade">학년</Label>
              <Select onValueChange={(val) => setValue("grade", val, { shouldValidate: true })}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="학년 선택" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((g) => (
                    <SelectItem key={g} value={String(g)}>{g}학년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
            </div>

            {submitError && (
              <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md p-2">
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
              size="lg"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              회원가입
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-4">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">로그인</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
