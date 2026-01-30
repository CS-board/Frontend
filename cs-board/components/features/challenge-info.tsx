import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp, Trophy } from "lucide-react"

export function ChallengeInfo() {
  return (
    <section className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">현재 챌린지</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">챌린지 기간</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">D-3</div>
              <p className="text-xs text-muted-foreground mt-1">2024.01.01 - 01.07</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">내 현재 점수</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">450</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">+120 (시작 대비)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">내 순위</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5위</div>
              <p className="text-xs text-muted-foreground mt-1">상위 15%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
