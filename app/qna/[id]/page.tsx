"use client"

/** Q&A 단일 질문 상세(URL /qna/[id]) */
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Footer } from "@/components/features/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft, ThumbsUp, MessageSquare, Loader2, Send,
  CheckCircle2, Pencil, Trash2, X, Check,
} from "lucide-react"
import { qnaService } from "@/services/qna"
import { TOKEN_KEY } from "@/constants"
import type { QuestionDetail } from "@/types"

function decodeJWT(token: string) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(base64))
  } catch { return null }
}

export default function QnaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qid = Number(id)
  const router = useRouter()

  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [myName, setMyName] = useState<string | null>(null)
  const [myAuthorId, setMyAuthorId] = useState<number | null>(null)

  const [editingQuestion, setEditingQuestion] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState(false)

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentContent, setEditCommentContent] = useState("")
  const [savingComment, setSavingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      setIsLoggedIn(true)
      const claims = decodeJWT(token)
      if (claims) {
        setMyName(claims.name ?? claims.sub ?? null)
        setMyAuthorId(claims.id ?? claims.userId ?? null)
      }
    }
  }, [])

  const loadQuestion = async () => {
    try {
      const q = await qnaService.getDetail(qid)
      setQuestion(q)
      setLikeCount(q.likeCount)
    } catch (e) {
      setError(e instanceof Error ? e.message : "질문을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQuestion() }, [qid])  // eslint-disable-line react-hooks/exhaustive-deps

  const isMyQuestion = question && (
    (myAuthorId !== null && question.authorId === myAuthorId) ||
    (myName !== null && question.authorName === myName)
  )

  const isMyComment = (authorId: number, authorName: string) => {
    return (myAuthorId !== null && authorId === myAuthorId) ||
      (myName !== null && authorName === myName)
  }

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
      await loadQuestion()
      setComment("")
    } catch (e) {
      alert(e instanceof Error ? e.message : "댓글 등록에 실패했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  const startEditQuestion = () => {
    if (!question) return
    setEditTitle(question.title)
    setEditContent(question.content)
    setEditingQuestion(true)
  }

  const cancelEditQuestion = () => {
    setEditingQuestion(false)
    setEditTitle("")
    setEditContent("")
  }

  const saveQuestion = async () => {
    if (!editTitle.trim() || !editContent.trim()) return
    setSavingQuestion(true)
    try {
      await qnaService.update(qid, editTitle.trim(), editContent.trim())
      await loadQuestion()
      setEditingQuestion(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : "수정에 실패했습니다")
    } finally {
      setSavingQuestion(false)
    }
  }

  const deleteQuestion = async () => {
    if (!confirm("질문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return
    setDeletingQuestion(true)
    try {
      await qnaService.delete(qid)
      router.push("/qna")
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다")
      setDeletingQuestion(false)
    }
  }

  const startEditComment = (commentId: number, content: string) => {
    setEditingCommentId(commentId)
    setEditCommentContent(content)
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentContent("")
  }

  const saveComment = async (commentId: number) => {
    if (!editCommentContent.trim()) return
    setSavingComment(true)
    try {
      await qnaService.updateComment(qid, commentId, editCommentContent.trim())
      await loadQuestion()
      setEditingCommentId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : "댓글 수정에 실패했습니다")
    } finally {
      setSavingComment(false)
    }
  }

  const deleteComment = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return
    setDeletingCommentId(commentId)
    try {
      await qnaService.deleteComment(qid, commentId)
      await loadQuestion()
    } catch (e) {
      alert(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다")
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="CHIP_SAT" width={32} height={32} className="rounded-lg" />
          <span className="font-mono text-lg font-bold text-foreground">CHIP_SAT</span>
        </div>
        <MobileMenu />
      </header>

      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-4 md:p-8">
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
                {/* 질문 본문 */}
                <Card>
                  <CardHeader className="space-y-3">
                    {editingQuestion ? (
                      <div className="space-y-3">
                        <input
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="제목"
                        />
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none min-h-[150px]"
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          placeholder="내용"
                          rows={6}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveQuestion} disabled={savingQuestion || !editTitle.trim() || !editContent.trim()} className="gap-1.5">
                            {savingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            저장
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditQuestion} className="gap-1.5">
                            <X className="h-4 w-4" />
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-2xl leading-snug">{question.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {question.solved && (
                              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 해결됨
                              </Badge>
                            )}
                            {isMyQuestion && (
                              <>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={startEditQuestion}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={deleteQuestion} disabled={deletingQuestion}>
                                  {deletingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{question.authorName}</span>
                          <span>•</span>
                          <span>{question.timeAgo}</span>
                        </div>
                      </>
                    )}
                  </CardHeader>
                  {!editingQuestion && (
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
                  )}
                </Card>

                {/* 댓글 목록 */}
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">댓글 {question.commentCount}개</h2>
                  {question.comments.map(c => (
                    <Card key={c.id} className={c.deleted ? "opacity-50" : ""}>
                      <CardContent className="pt-4 pb-4">
                        {!c.deleted && editingCommentId === c.id ? (
                          <div className="space-y-2">
                            <textarea
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                              value={editCommentContent}
                              onChange={e => setEditCommentContent(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveComment(c.id)} disabled={savingComment || !editCommentContent.trim()} className="gap-1.5">
                                {savingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                저장
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditComment} className="gap-1.5">
                                <X className="h-3.5 w-3.5" />
                                취소
                              </Button>
                            </div>
                          </div>
                        ) : (
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
                            {!c.deleted && isMyComment(c.authorId, c.authorName) && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEditComment(c.id, c.content)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteComment(c.id)} disabled={deletingCommentId === c.id}>
                                  {deletingCommentId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* 댓글 작성 */}
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
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
