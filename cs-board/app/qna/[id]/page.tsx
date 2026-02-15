"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ThumbsUp, MessageSquare, Loader2, Send, CheckCircle2 } from "lucide-react"
import { qnaService } from "@/services/qna"
import { TOKEN_KEY } from "@/constants"
import type { QuestionDetail } from "@/types"

export default function QnaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qid = Number(id)
  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem(TOKEN_KEY))
  }, [])

  useEffect(() => {
    qnaService.getDetail(qid)
      .then(q => { setQuestion(q); setLikeCount(q.likeCount) })
      .catch(e => setError(e instanceof Error ? e.message : "질문을 불러오는데 실패했습니다"))
      .finally(() => setLoading(false))
  }, [qid])

  const handleLike = async () => {
    if (!isLoggedIn) return
    try {
      const res = await qnaService.toggleLike(qid)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch {/* ignore */}
  }

  const handleComment = async () => {
    if (!comment.trim() || !isLoggedIn) return
    setSubmitting(true)
    try {
      await qnaService.createComment(qid, comment.trim())
      const updated = await qnaService.getDetail(qid)
      setQuestion(updated)
      setComment("")
    } catch (e) {
      alert(e instanceof Error ? e.message : "댓글 등록에 실패했습니다")
    } finally {
      setSubmitting(false)
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
          <div className="mx-auto max-w-3xl space-y-6">
            <Button variant="ghost" asChild className="gap-2 -ml-2">
              <Link href="/qna"><ChevronLeft className="h-4 w-4" /> 목록으로</Link>
            </Button>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">{error}</div>
            ) : question ? (
              <>
                {/* Question */}
                <Card>
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-2xl leading-snug">{question.title}</CardTitle>
                      {question.solved && (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 flex-shrink-0 gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 해결됨
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{question.authorName}</span>
                      <span>•</span>
                      <span>{question.timeAgo}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="whitespace-pre-wrap text-sm leading-7">{question.content}</div>
                    <div className="flex items-center gap-4 pt-2 border-t border-border">
                      <button
                        onClick={handleLike}
                        disabled={!isLoggedIn}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                        <span>{likeCount}</span>
                      </button>
                      <button onClick={() => commentRef.current?.focus()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare className="h-4 w-4" />
                        <span>{question.commentCount}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments */}
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">댓글 {question.commentCount}개</h2>
                  {question.comments.map(c => (
                    <Card key={c.id} className={c.deleted ? "opacity-50" : ""}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{c.authorName}</span>
                              <span className="text-xs text-muted-foreground">{c.timeAgo}</span>
                            </div>
                            <p className="text-sm leading-6 text-foreground/80">
                              {c.deleted ? "삭제된 댓글입니다" : c.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Comment Form */}
                  {isLoggedIn ? (
                    <div className="flex gap-3 pt-2">
                      <textarea
                        ref={commentRef}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        rows={3}
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                        onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment() }}
                      />
                      <Button onClick={handleComment} disabled={!comment.trim() || submitting} className="gap-2">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        등록
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      <Link href="/login" className="text-primary hover:underline">로그인</Link>하면 댓글을 남길 수 있습니다
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
