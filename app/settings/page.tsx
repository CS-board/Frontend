"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { User, Lock, LogOut, Save, CheckCircle2, Loader2, GraduationCap, Building2, Eye, EyeOff, RefreshCw, ShieldCheck, XCircle } from "lucide-react"
import { authService } from "@/services/auth"
import { recordService } from "@/services/record"
import { userService } from "@/services/user"
import { TOKEN_KEY } from "@/constants"
import type { UserProfileDetail } from "@/types"

type PasswordStep = "idle" | "sending" | "code" | "verifying" | "new" | "done"

export default function SettingsPage() {
  const router = useRouter()

  // profile from API
  const [profile, setProfile] = useState<UserProfileDetail | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [departments, setDepartments] = useState<string[]>([])

  // goal points
  const [goalPoints, setGoalPoints] = useState("")
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)
  const [goalError, setGoalError] = useState("")

  // grade change
  const [grade, setGrade] = useState("")
  const [savingGrade, setSavingGrade] = useState(false)
  const [gradeSaved, setGradeSaved] = useState(false)
  const [gradeError, setGradeError] = useState("")

  // department change
  const [department, setDepartment] = useState("")
  const [savingDept, setSavingDept] = useState(false)
  const [deptSaved, setDeptSaved] = useState(false)
  const [deptError, setDeptError] = useState("")

  // password reset flow
  const [pwStep, setPwStep] = useState<PasswordStep>("idle")
  const [pwCode, setPwCode] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwError, setPwError] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { router.replace("/login"); return }

    async function loadProfile() {
      try {
        const [detail, depts] = await Promise.all([
          userService.getDetail(),
          authService.getDepartments(),
        ])
        setProfile(detail)
        setGoalPoints(String(detail.goalPoints ?? ""))
        setGrade(String(detail.grade ?? "1"))
        setDepartment(detail.department ?? "")
        setDepartments(depts)
      } catch {
        // fallback: decode JWT if API fails
        try {
          const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
          const claims = JSON.parse(atob(base64))
          setProfile({
            name: claims.name ?? "",
            studentId: claims.studentId ?? "",
            department: claims.department ?? "",
            grade: claims.grade ?? 1,
            email: claims.sub ?? "",
            bojId: claims.bojId ?? "",
            goalPoints: 0,
          })
          if (claims.grade) setGrade(String(claims.grade))
          if (claims.department) setDepartment(claims.department)
        } catch {/* ignore */}
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [router])

  // ── Goal Points ────────────────────────────────────────────────────────────

  const handleSaveGoal = async () => {
    const pts = Number(goalPoints)
    if (!goalPoints || isNaN(pts) || pts < 0) { setGoalError("올바른 점수를 입력하세요"); return }
    setSavingGoal(true); setGoalError("")
    try {
      await recordService.updateGoalPoints(pts)
      setGoalSaved(true)
      setProfile(p => p ? { ...p, goalPoints: pts } : p)
      setTimeout(() => setGoalSaved(false), 3000)
    } catch (e) {
      setGoalError(e instanceof Error ? e.message : "저장에 실패했습니다")
    } finally {
      setSavingGoal(false)
    }
  }

  // ── Grade ──────────────────────────────────────────────────────────────────

  const handleSaveGrade = async () => {
    const g = Number(grade)
    if (!grade || isNaN(g) || g < 1 || g > 5) { setGradeError("올바른 학년을 선택하세요"); return }
    setSavingGrade(true); setGradeError("")
    try {
      const res = await userService.updateGrade(g)
      setProfile(p => p ? { ...p, grade: res.grade } : p)
      setGradeSaved(true)
      setTimeout(() => setGradeSaved(false), 3000)
    } catch (e) {
      setGradeError(e instanceof Error ? e.message : "학년 변경에 실패했습니다")
    } finally {
      setSavingGrade(false)
    }
  }

  // ── Department ─────────────────────────────────────────────────────────────

  const handleSaveDept = async () => {
    if (!department.trim()) { setDeptError("학과를 선택하세요"); return }
    setSavingDept(true); setDeptError("")
    try {
      const res = await userService.updateDepartment(department)
      setProfile(p => p ? { ...p, department: res.department } : p)
      setDeptSaved(true)
      setTimeout(() => setDeptSaved(false), 3000)
    } catch (e) {
      setDeptError(e instanceof Error ? e.message : "학과 변경에 실패했습니다")
    } finally {
      setSavingDept(false)
    }
  }

  // ── Password Reset ─────────────────────────────────────────────────────────

  const username = profile?.email ?? ""

  const startCooldown = () => {
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendPwMail = async () => {
    if (!username) { setPwError("이메일 정보를 찾을 수 없습니다"); return }
    setPwLoading(true); setPwError(""); setPwStep("sending")
    try {
      await authService.sendPasswordResetMail(username)
      setPwStep("code")
      startCooldown()
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "메일 전송에 실패했습니다")
      setPwStep("idle")
    } finally {
      setPwLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!username || resendCooldown > 0) return
    setResendLoading(true); setPwError("")
    try {
      await authService.sendPasswordResetMail(username)
      setPwCode("")
      startCooldown()
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "재전송에 실패했습니다")
    } finally {
      setResendLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!pwCode.trim()) { setPwError("인증 코드를 입력하세요"); return }
    setPwLoading(true); setPwError(""); setPwStep("verifying")
    try {
      await authService.verifyPasswordResetCode(username, pwCode.trim())
      setPwStep("new")
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "코드 확인에 실패했습니다")
      setPwStep("code")
    } finally {
      setPwLoading(false)
    }
  }

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{10,20}$/

  const handleResetPassword = async () => {
    if (!PASSWORD_REGEX.test(newPw)) { setPwError("비밀번호: 대소문자·숫자·특수문자 포함 10~20자"); return }
    if (newPw !== confirmPw) { setPwError("비밀번호가 일치하지 않습니다"); return }
    setPwLoading(true); setPwError("")
    try {
      await authService.resetPassword(username, newPw)
      setPwStep("done")
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "비밀번호 변경에 실패했습니다")
    } finally {
      setPwLoading(false)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    try { await authService.logout() } catch {/* ignore */}
    localStorage.removeItem(TOKEN_KEY)
    router.push("/")
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="CHIP_SAT" width={32} height={32} className="rounded-lg" />
          <span className="font-mono text-lg font-bold text-foreground">CHIP_SAT</span>
        </div>
        <MobileMenu />
      </header>

      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-2xl space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-balance">설정</h1>
              <p className="text-muted-foreground mt-2">계정 정보 및 목표 점수를 관리하세요</p>
            </div>

            {/* 프로필 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  프로필 정보
                </CardTitle>
                <CardDescription>기본 프로필 정보를 확인하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>이름</Label>
                        <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                          <span className="font-medium">{profile?.name ?? "—"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">이름은 변경할 수 없습니다</p>
                      </div>
                      <div className="space-y-2">
                        <Label>학번</Label>
                        <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                          <span className="font-mono">{profile?.studentId ?? "—"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">학번은 변경할 수 없습니다</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>이메일</Label>
                        <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                          <span>{profile?.email ?? "—"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>백준 ID</Label>
                        <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                          {profile?.bojId ? (
                            <a
                              href={`https://www.acmicpc.net/user/${profile.bojId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-primary hover:underline"
                            >
                              {profile.bojId}
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 border border-border p-3 flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" />
                        <span>현재 학년:</span>
                        <Badge variant="secondary" className="font-mono">{profile?.grade ?? "—"}학년</Badge>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        <span>현재 학과:</span>
                        <Badge variant="secondary">{profile?.department ?? "—"}</Badge>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 학년 변경 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  학년 변경
                </CardTitle>
                <CardDescription>학년 정보를 업데이트하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {gradeSaved && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      학년이 변경되었습니다.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="grade">학년 선택</Label>
                    <Select value={grade} onValueChange={v => { setGrade(v); setGradeError("") }}>
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="학년 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {["1","2","3","4","5"].map(g => (
                          <SelectItem key={g} value={g}>{g}학년{g === "5" ? " 이상" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {gradeError && <p className="text-xs text-destructive">{gradeError}</p>}
                  </div>
                  <Button onClick={handleSaveGrade} disabled={savingGrade || !grade} className="gap-2">
                    {savingGrade ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 학과 변경 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  학과 변경
                </CardTitle>
                <CardDescription>학과 정보를 업데이트하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deptSaved && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      학과가 변경되었습니다.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="dept">학과 선택</Label>
                    {departments.length > 0 ? (
                      <Select value={department} onValueChange={v => { setDepartment(v); setDeptError("") }}>
                        <SelectTrigger id="dept">
                          <SelectValue placeholder="학과 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="dept"
                        value={department}
                        onChange={e => { setDepartment(e.target.value); setDeptError("") }}
                        placeholder="학과명 입력"
                      />
                    )}
                    {deptError && <p className="text-xs text-destructive">{deptError}</p>}
                  </div>
                  <Button onClick={handleSaveDept} disabled={savingDept || !department} className="gap-2">
                    {savingDept ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 목표 점수 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  목표 점수
                </CardTitle>
                <CardDescription>이번 챌린지의 목표 점수를 설정하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {goalSaved && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      목표 점수가 저장되었습니다.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="goal">목표 점수 (점)</Label>
                    <Input
                      id="goal"
                      type="number"
                      min={0}
                      placeholder="ex) 500"
                      value={goalPoints}
                      onChange={e => { setGoalPoints(e.target.value); setGoalError("") }}
                    />
                    {goalError && <p className="text-xs text-destructive">{goalError}</p>}
                  </div>
                  <Button onClick={handleSaveGoal} disabled={savingGoal || !goalPoints} className="gap-2">
                    {savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 보안 — 비밀번호 변경 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  보안
                </CardTitle>
                <CardDescription>이메일 인증을 통해 비밀번호를 변경합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* idle */}
                {pwStep === "idle" && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleSendPwMail}
                    disabled={pwLoading}
                  >
                    <Lock className="h-4 w-4" />
                    비밀번호 변경하기
                  </Button>
                )}

                {/* sending */}
                {(pwStep === "sending" || pwStep === "verifying") && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {pwStep === "sending" ? "인증 메일 전송 중..." : "코드 확인 중..."}
                  </div>
                )}

                {/* code input */}
                {pwStep === "code" && (
                  <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">인증 코드를 확인하세요</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">{username}</span>
                          으로 6자리 코드를 발송했습니다
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="인증 코드 6자리 입력"
                          value={pwCode}
                          onChange={e => { setPwCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setPwError("") }}
                          maxLength={6}
                          className="flex-1 font-mono text-base tracking-widest text-center"
                          autoFocus
                          onKeyDown={e => { if (e.key === "Enter" && pwCode.trim().length > 0) handleVerifyCode() }}
                        />
                        <Button onClick={handleVerifyCode} disabled={!pwCode.trim() || pwLoading} className="px-5">
                          확인
                        </Button>
                      </div>

                      {pwError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3 flex-shrink-0" />
                          {pwError}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resendCooldown > 0 || resendLoading}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendLoading
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" />
                          }
                          {resendCooldown > 0 ? `재전송 (${resendCooldown}초)` : "코드 재전송"}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => { setPwStep("idle"); setPwCode(""); setPwError(""); setResendCooldown(0) }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* new password */}
                {pwStep === "new" && (
                  <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">인증 완료 — 새 비밀번호를 설정하세요</span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="newPwSettings" className="text-sm font-semibold">새 비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="newPwSettings"
                          type={showNewPw ? "text" : "password"}
                          placeholder="대소문자·숫자·특수문자 포함 10~20자"
                          value={newPw}
                          onChange={e => { setNewPw(e.target.value); setPwError("") }}
                          className="pr-10"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Password requirement hints */}
                      {newPw && (
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {[
                            { label: "10~20자", ok: newPw.length >= 10 && newPw.length <= 20 },
                            { label: "소문자 포함", ok: /[a-z]/.test(newPw) },
                            { label: "대문자 포함", ok: /[A-Z]/.test(newPw) },
                            { label: "숫자 포함", ok: /\d/.test(newPw) },
                            { label: "특수문자 포함", ok: /[!@#$%^&*]/.test(newPw) },
                          ].map(({ label, ok }) => (
                            <div key={label} className={`flex items-center gap-1 text-xs ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                              {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPwSettings" className="text-sm font-semibold">비밀번호 확인</Label>
                      <div className="relative">
                        <Input
                          id="confirmPwSettings"
                          type={showConfirmPw ? "text" : "password"}
                          placeholder="비밀번호를 다시 입력하세요"
                          value={confirmPw}
                          onChange={e => { setConfirmPw(e.target.value); setPwError("") }}
                          className={`pr-10 ${confirmPw && (confirmPw === newPw ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive")}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

                    {pwError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" />
                        {pwError}
                      </p>
                    )}

                    <div className="flex gap-3 pt-1">
                      <Button
                        onClick={handleResetPassword}
                        disabled={!newPw || !confirmPw || newPw !== confirmPw || pwLoading}
                        className="flex-1 gap-2"
                      >
                        {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        비밀번호 변경 완료
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setPwStep("idle"); setNewPw(""); setConfirmPw(""); setPwError(""); setShowNewPw(false); setShowConfirmPw(false) }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                )}

                {/* done */}
                {pwStep === "done" && (
                  <div className="space-y-3">
                    <Alert className="border-emerald-500/50 bg-emerald-500/10">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <AlertDescription className="text-emerald-700 dark:text-emerald-400 font-medium">
                        비밀번호가 성공적으로 변경되었습니다.
                      </AlertDescription>
                    </Alert>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => { setPwStep("idle"); setNewPw(""); setConfirmPw(""); setPwCode(""); setPwError("") }}
                    >
                      닫기
                    </Button>
                  </div>
                )}

                {/* Global error (non-step-specific) */}
                {pwError && pwStep !== "code" && pwStep !== "new" && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    {pwError}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 로그아웃 */}
            <div className="flex justify-start">
              <Button variant="destructive" className="gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
