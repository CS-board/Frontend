"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, ThumbsUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { qnaService } from "@/services/qna"
import type { QuestionSummary } from "@/types"

const PAGE_SIZE = 10

export default function QnaPage() {
  const [questions, setQuestions] = useState<QuestionSummary[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    qnaService.getList(page, PAGE_SIZE)
      .then(r => { setQuestions(r.items); setTotalPages(r.totalPages || 1) })
      .catch(e => setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다"))
      .finally(() => setLoading(false))
  }, [page])

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
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">백준 Q&A</h1>
                <p className="text-muted-foreground mt-2">알고리즘 문제 풀이에 대해 질문하고 답변하세요</p>
              </div>
              <Button size="lg" className="gap-2" asChild>
                <Link href="/qna/new"><Plus className="h-4 w-4" />질문하기</Link>
              </Button>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {questions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">아직 질문이 없습니다. 첫 번째 질문을 남겨보세요!</p>
                  ) : questions.map((q) => (
                    <Link key={q.id} href={`/qna/${q.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-balance">{q.title}</CardTitle>
                              <CardDescription className="mt-2 flex items-center gap-3 flex-wrap">
                                <span>{q.authorName}</span>
                                <span>•</span>
                                <span>{q.timeAgo}</span>
                                {q.solved && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                                      해결됨
                                    </Badge>
                                  </>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-4 w-4" />
                              <span>{q.commentCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{q.likeCount}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">{page + 1} / {totalPages}</span>
                    <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
