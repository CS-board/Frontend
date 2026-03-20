/** 홈용 목업 랭킹(실데이터는 /ranking 페이지) */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal } from "lucide-react"

const rankings = [
  { rank: 1, name: "김철수", studentId: "2021****", department: "컴퓨터공학과", score: 850, grade: 3 },
  { rank: 2, name: "이영희", studentId: "2022****", department: "소프트웨어공학과", score: 720, grade: 2 },
  { rank: 3, name: "박민수", studentId: "2020****", department: "컴퓨터공학과", score: 680, grade: 4 },
  { rank: 4, name: "정수진", studentId: "2023****", department: "인공지능공학과", score: 620, grade: 1 },
  { rank: 5, name: "최동욱", studentId: "2021****", department: "컴퓨터공학과", score: 580, grade: 3 },
  { rank: 6, name: "한지민", studentId: "2022****", department: "소프트웨어공학과", score: 540, grade: 2 },
  { rank: 7, name: "강태현", studentId: "2021****", department: "컴퓨터공학과", score: 510, grade: 3 },
  { rank: 8, name: "윤서연", studentId: "2023****", department: "인공지능공학과", score: 480, grade: 1 },
]

export function WeeklyRanking() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-mono text-2xl md:text-3xl">주간 랭킹</CardTitle>
              <CardDescription className="mt-1.5">점수는 매일 밤 자정에 갱신됩니다</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit font-mono">
              마지막 업데이트: 2025-01-02 00:00
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rankings.map((user) => (
              <div
                key={user.rank}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted md:gap-4 md:p-4 ${
                  user.rank <= 3 ? "border-primary/20 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex w-12 items-center justify-center md:w-16">
                  {user.rank === 1 && <Trophy className="h-6 w-6 text-yellow-600 md:h-7 md:w-7" />}
                  {user.rank === 2 && <Medal className="h-6 w-6 text-gray-400 md:h-7 md:w-7" />}
                  {user.rank === 3 && <Medal className="h-6 w-6 text-amber-700 md:h-7 md:w-7" />}
                  {user.rank > 3 && (
                    <span className="font-mono text-lg font-bold text-muted-foreground md:text-xl">{user.rank}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                    <span className="truncate font-mono text-base font-semibold text-foreground md:text-lg">
                      {user.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:text-sm">
                      <span className="font-mono">{user.studentId}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="truncate">{user.department}</span>
                      <span className="hidden md:inline">•</span>
                      <span>{user.grade}학년</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 md:w-24">
                  <span className="font-mono text-xl font-bold text-foreground md:text-2xl">{user.score}</span>
                  <span className="text-xs text-muted-foreground">점수</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="font-mono text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              더 보기
            </button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
