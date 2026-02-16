"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
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
import { User, Lock, LogOut, Save, CheckCircle2, Loader2 } from "lucide-react"
import { authService } from "@/services/auth"
import { recordService } from "@/services/record"
import { TOKEN_KEY } from "@/constants"

function decodeJWT(token: string) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

type PasswordStep = "idle" | "sending" | "code" | "verifying" | "new" | "done"

export default function SettingsPage() {
  const router = useRouter()

  // user info from JWT
  const [userInfo, setUserInfo] = useState<Record<string, string>>({})

  // goal points
  const [goalPoints, setGoalPoints] = useState("")
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)
  const [goalError, setGoalError] = useState("")

  // grade (could be updated via API if endpoint exists — displayed from JWT for now)
  const [grade, setGrade] = useState("3")

  // password reset flow
  const [pwStep, setPwStep] = useState<PasswordStep>("idle")
  const [pwCode, setPwCode] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwError, setPwError] = useState("")
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { router.replace("/login"); return }
    const claims = decodeJWT(token)
    if (claims) setUserInfo(claims)
    // pre-fill grade if available
    if (claims?.grade) setGrade(String(claims.grade))
  }, [router])

  // ── Goal Points ────────────────────────────────────────────────────────────

  const handleSaveGoal = async () => {
    const pts = Number(goalPoints)
    if (!goalPoints || isNaN(pts) || pts < 0) { setGoalError("올바른 점수를 입력하세요"); return }
    setSavingGoal(true)
    setGoalError("")
    try {
      await recordService.updateGoalPoints(pts)
      setGoalSaved(true)
      setTimeout(() => setGoalSaved(false), 3000)
    } catch (e) {
      setGoalError(e instanceof Error ? e.message : "저장에 실패했습니다")
    } finally {
      setSavingGoal(false)
    }
  }

  // ── Password Reset ─────────────────────────────────────────────────────────

  const username = userInfo.sub || userInfo.username || userInfo.email || ""

  const handleSendPwMail = async () => {
    if (!username) { setPwError("이메일 정보를 찾을 수 없습니다"); return }
    setPwLoading(true); setPwError(""); setPwStep("sending")
    try {
      await authService.sendPasswordResetMail(username)
      setPwStep("code")
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "메일 전송에 실패했습니다")
      setPwStep("idle")
    } finally {
      setPwLoading(false)
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
    if (!PASSWORD_REGEX.test(newPw)) {
      setPwError("비밀번호: 대소문자·숫자·특수문자 포함 10~20자")
      return
    }
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
              <p className="text-muted-foreground mt-2">계정 및 목표 점수를 관리하세요</p>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>이름</Label>
                    <Input value={userInfo.name ?? "—"} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">이름은 변경할 수 없습니다</p>
                  </div>
                  <div className="space-y-2">
                    <Label>학번</Label>
                    <Input value={userInfo.studentId ?? "—"} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">학번은 변경할 수 없습니다</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>학과</Label>
                    <Input value={userInfo.department ?? "—"} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">학년</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger id="grade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["1","2","3","4","5"].map(g => (
                          <SelectItem key={g} value={g}>{g}학년{g === "5" ? " 이상" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input value={userInfo.sub ?? userInfo.username ?? "—"} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>백준 ID</Label>
                  <Input value={userInfo.bojId ?? "—"} disabled className="bg-muted" />
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
                <div className="flex gap-3">
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
                  <div className="flex items-end">
                    <Button onClick={handleSaveGoal} disabled={savingGoal || !goalPoints} className="gap-2">
                      {savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      저장
                    </Button>
                  </div>
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
                <CardDescription>비밀번호를 변경하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pwStep === "idle" && (
                  <Button variant="outline" className="w-full justify-start" onClick={handleSendPwMail} disabled={pwLoading}>
                    비밀번호 변경
                  </Button>
                )}

                {(pwStep === "sending") && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    인증 메일 전송 중...
                  </div>
                )}

                {pwStep === "code" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{username}</span>으로 인증 코드를 발송했습니다.
                    </p>
                    <div className="flex gap-3">
                      <Input
                        placeholder="인증 코드 입력"
                        value={pwCode}
                        onChange={e => { setPwCode(e.target.value); setPwError("") }}
                        className="flex-1"
                      />
                      <Button onClick={handleVerifyCode} disabled={!pwCode.trim() || pwLoading}>
                        {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "확인"}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setPwStep("idle"); setPwCode(""); setPwError("") }}>
                      취소
                    </Button>
                  </div>
                )}

                {pwStep === "verifying" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    코드 확인 중...
                  </div>
                )}

                {pwStep === "new" && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="newPw">새 비밀번호</Label>
                      <Input
                        id="newPw"
                        type="password"
                        placeholder="대소문자·숫자·특수문자 포함 10~20자"
                        value={newPw}
                        onChange={e => { setNewPw(e.target.value); setPwError("") }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPw">비밀번호 확인</Label>
                      <Input
                        id="confirmPw"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPw}
                        onChange={e => { setConfirmPw(e.target.value); setPwError("") }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleResetPassword} disabled={!newPw || !confirmPw || pwLoading} className="flex-1">
                        {pwLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        비밀번호 변경
                      </Button>
                      <Button variant="outline" onClick={() => { setPwStep("idle"); setNewPw(""); setConfirmPw(""); setPwError("") }}>
                        취소
                      </Button>
                    </div>
                  </div>
                )}

                {pwStep === "done" && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      비밀번호가 성공적으로 변경되었습니다.
                    </AlertDescription>
                  </Alert>
                )}

                {pwError && (
                  <p className="text-sm text-destructive">{pwError}</p>
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
