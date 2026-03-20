"use client"

/** 설정: 프로필·학년/학과·목표점수·비밀번호 변경(/change-password)·로그아웃·회원탈퇴 */
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  User, Lock, LogOut, Save, CheckCircle2, Loader2,
  GraduationCap, Building2, ChevronRight, Target, AlertTriangle, Trash2,
} from "lucide-react"
import { authService } from "@/services/auth"
import { recordService } from "@/services/record"
import { userService } from "@/services/user"
import { TOKEN_KEY } from "@/constants"
import type { UserProfileDetail } from "@/types"

export default function SettingsPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfileDetail | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [departments, setDepartments] = useState<string[]>([])

  const [goalPoints, setGoalPoints] = useState("")
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)
  const [goalError, setGoalError] = useState("")

  const [grade, setGrade] = useState("")
  const [savingGrade, setSavingGrade] = useState(false)
  const [gradeSaved, setGradeSaved] = useState(false)
  const [gradeError, setGradeError] = useState("")

  const [department, setDepartment] = useState("")
  const [savingDept, setSavingDept] = useState(false)
  const [deptSaved, setDeptSaved] = useState(false)
  const [deptError, setDeptError] = useState("")

  const [withdrawConfirm, setWithdrawConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState("")

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
        try {
          const base64 = token!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
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

  const handleLogout = async () => {
    try { await authService.logout() } catch {/* ignore */}
    localStorage.removeItem(TOKEN_KEY)
    router.push("/")
  }

  const handleWithdraw = async () => {
    setWithdrawing(true); setWithdrawError("")
    try {
      await userService.withdraw()
      localStorage.removeItem(TOKEN_KEY)
      router.push("/login")
    } catch (e) {
      setWithdrawError(e instanceof Error ? e.message : "탈퇴 처리에 실패했습니다")
      setWithdrawing(false)
      setWithdrawConfirm(false)
    }
  }

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
                        <span>학년:</span>
                        <Badge variant="secondary" className="font-mono">{profile?.grade ?? "—"}학년</Badge>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        <span>학과:</span>
                        <Badge variant="secondary">{profile?.department ?? "—"}</Badge>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        <span>목표:</span>
                        <Badge variant="secondary" className="font-mono">
                          {profile?.goalPoints ? `${profile.goalPoints}점` : "미설정"}
                        </Badge>
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
                  <Target className="h-5 w-5" />
                  목표 점수
                </CardTitle>
                <CardDescription>이번 챌린지의 목표 점수를 설정하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 현재 목표 점수 표시 */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">현재 목표 점수</span>
                  </div>
                  <span className="font-mono font-bold text-primary text-lg">
                    {profile?.goalPoints ? `${profile.goalPoints}점` : "미설정"}
                  </span>
                </div>

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
                    <Label htmlFor="goal">새 목표 점수 (점)</Label>
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
              <CardContent>
                <button
                  onClick={() => router.push("/change-password")}
                  className="w-full flex items-center justify-between rounded-lg border border-border px-4 py-3.5 hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">비밀번호 변경</p>
                      <p className="text-xs text-muted-foreground">이메일 인증 후 새 비밀번호 설정</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </CardContent>
            </Card>

            {/* 계정 관리 */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  계정 관리
                </CardTitle>
                <CardDescription>로그아웃하거나 계정을 영구적으로 삭제합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>

                {!withdrawConfirm ? (
                  <div className="sm:inline-block sm:ml-2">
                    <Button
                      variant="ghost"
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                      onClick={() => setWithdrawConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      회원 탈퇴
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3 mt-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">정말 탈퇴하시겠습니까?</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          탈퇴 시 모든 기록이 삭제되며 <span className="font-medium text-foreground">되돌릴 수 없습니다</span>.
                        </p>
                      </div>
                    </div>
                    {withdrawError && (
                      <p className="text-xs text-destructive">{withdrawError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                      >
                        {withdrawing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        탈퇴 확인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setWithdrawConfirm(false); setWithdrawError("") }}
                        disabled={withdrawing}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
