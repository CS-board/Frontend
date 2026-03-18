"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Footer } from "@/components/features/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare, Plus, ThumbsUp, Loader2,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Send, CheckCircle2, Pencil, Trash2, X, Check,
  MessageCircle, User,
} from "lucide-react"
import { qnaService } from "@/services/qna"
import { TOKEN_KEY } from "@/constants"
import type { QuestionSummary, QuestionDetail } from "@/types"

const PAGE_SIZE = 10
const LIKES_KEY = "chipsat_liked_questions"

function decodeJWT(token: string) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(base64))
  } catch { return null }
}

function loadLikesFromStorage(): Record<number, boolean> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) ?? "{}") } catch { return {} }
}
function saveLikesToStorage(map: Record<number, boolean>) {
  if (typeof window === "undefined") return
  localStorage.setItem(LIKES_KEY, JSON.stringify(map))
}


export default function QnaPage() {
  const [questions, setQuestions] = useState<QuestionSummary[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // auth
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [myName, setMyName] = useState<string | null>(null)
  const [myAuthorId, setMyAuthorId] = useState<number | null>(null)

  // accordion
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detailCache, setDetailCache] = useState<Record<number, QuestionDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null)
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>(() => loadLikesFromStorage())

  // comment inputs
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [submittingComment, setSubmittingComment] = useState<number | null>(null)
  const commentRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})

  // question edit/delete
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null)

  // comment edit/delete
  const [editingComment, setEditingComment] = useState<{ qid: number; cid: number } | null>(null)
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
    // Load persisted like states
    setLikedMap(loadLikesFromStorage())
  }, [])

  const loadList = () => {
    setLoading(true)
    setError("")
    qnaService.getList(page, PAGE_SIZE)
      .then(r => { setQuestions(r.items); setTotalPages(r.totalPages || 1) })
      .catch(e => setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setExpandedId(null)
    loadList()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDetail = async (id: number) => {
    setLoadingDetail(id)
    try {
      const detail = await qnaService.getDetail(id)
      setDetailCache(prev => ({ ...prev, [id]: detail }))
      setLikeCountMap(prev => ({ ...prev, [id]: detail.likeCount }))
    } catch {/* ignore */}
    finally { setLoadingDetail(null) }
  }

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!detailCache[id]) await loadDetail(id)
  }

  const isMyQuestion = (authorId: number, authorName: string) =>
    (myAuthorId !== null && authorId === myAuthorId) ||
    (myName !== null && authorName === myName)

  const isMyComment = (authorId: number, authorName: string) =>
    (myAuthorId !== null && authorId === myAuthorId) ||
    (myName !== null && authorName === myName)

  // ── Like ─────────────────────────────────────────────────────────────────
  const handleLike = async (qid: number) => {
    if (!isLoggedIn) return
    try {
      const res = await qnaService.toggleLike(qid)
      setLikedMap(prev => {
        const next = { ...prev, [qid]: res.liked }
        saveLikesToStorage(next)
        return next
      })
      setLikeCountMap(prev => ({ ...prev, [qid]: res.likeCount }))
    } catch {/* ignore */}
  }

  // ── Comment ───────────────────────────────────────────────────────────────
  const handleComment = async (qid: number) => {
    const text = (commentInputs[qid] ?? "").trim()
    if (!text || !isLoggedIn) return
    setSubmittingComment(qid)
    try {
      await qnaService.createComment(qid, text)
      await loadDetail(qid)
      setCommentInputs(prev => ({ ...prev, [qid]: "" }))
    } catch (e) { alert(e instanceof Error ? e.message : "댓글 등록에 실패했습니다") }
    finally { setSubmittingComment(null) }
  }

  // ── Question edit/delete ──────────────────────────────────────────────────
  const startEditQuestion = (q: QuestionDetail) => {
    setEditingQuestionId(q.id)
    setEditTitle(q.title)
    setEditContent(q.content)
  }

  const saveQuestion = async (qid: number) => {
    if (!editTitle.trim() || !editContent.trim()) return
    setSavingQuestion(true)
    try {
      await qnaService.update(qid, editTitle.trim(), editContent.trim())
      await loadDetail(qid)
      loadList()
      setEditingQuestionId(null)
    } catch (e) { alert(e instanceof Error ? e.message : "수정에 실패했습니다") }
    finally { setSavingQuestion(false) }
  }

  const deleteQuestion = async (qid: number) => {
    if (!confirm("질문을 삭제하시겠습니까?")) return
    setDeletingQuestionId(qid)
    try {
      await qnaService.delete(qid)
      setExpandedId(null)
      loadList()
    } catch (e) { alert(e instanceof Error ? e.message : "삭제에 실패했습니다") }
    finally { setDeletingQuestionId(null) }
  }

  // ── Comment edit/delete ───────────────────────────────────────────────────
  const startEditComment = (qid: number, cid: number, content: string) => {
    setEditingComment({ qid, cid })
    setEditCommentContent(content)
  }

  const saveComment = async () => {
    if (!editingComment || !editCommentContent.trim()) return
    setSavingComment(true)
    try {
      await qnaService.updateComment(editingComment.qid, editingComment.cid, editCommentContent.trim())
      await loadDetail(editingComment.qid)
      setEditingComment(null)
    } catch (e) { alert(e instanceof Error ? e.message : "댓글 수정에 실패했습니다") }
    finally { setSavingComment(false) }
  }

  const deleteComment = async (qid: number, cid: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return
    setDeletingCommentId(cid)
    try {
      await qnaService.deleteComment(qid, cid)
      await loadDetail(qid)
    } catch (e) { alert(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다") }
    finally { setDeletingCommentId(null) }
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

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">백준 Q&A</h1>
                  <p className="text-muted-foreground mt-1 text-sm">알고리즘 문제 풀이에 대해 질문하고 답변하세요</p>
                </div>
                {isLoggedIn && (
                  <Button asChild className="gap-2 shadow-sm">
                    <Link href="/qna/new"><Plus className="h-4 w-4" />질문하기</Link>
                  </Button>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">불러오는 중...</span>
                </div>
              ) : (
                <>
                  {questions.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-20 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground/70">아직 질문이 없습니다</p>
                        <p className="text-sm text-muted-foreground mt-1">첫 번째 질문을 남겨보세요!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q) => {
                        const isExpanded = expandedId === q.id
                        const detail = detailCache[q.id]
                        const isLoadingThis = loadingDetail === q.id
                        const liked = likedMap[q.id] ?? false
                        const likeCount = likeCountMap[q.id] ?? q.likeCount
                        const isEditingThis = editingQuestionId === q.id

                        return (
                          <div
                            key={q.id}
                            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                              isExpanded
                                ? "border-primary/30 shadow-md"
                                : "border-border hover:border-border/80 hover:shadow-sm"
                            }`}
                          >
                            {/* ── Question header row ── */}
                            <button
                              onClick={() => toggleExpand(q.id)}
                              className="w-full text-left px-5 py-4 flex items-start gap-3.5 bg-card hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                {/* Title + badges */}
                                <div className="flex items-start gap-2 flex-wrap mb-1.5">
                                  <span className={`font-semibold text-base leading-snug ${isExpanded ? "text-primary" : "text-foreground"}`}>
                                    {q.title}
                                  </span>
                                  {q.solved && (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1 text-xs flex-shrink-0">
                                      <CheckCircle2 className="h-3 w-3" />해결됨
                                    </Badge>
                                  )}
                                </div>

                                {/* Meta row */}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  <span className="font-medium text-foreground/60">{q.authorName}</span>
                                  <span>·</span>
                                  <span>{q.timeAgo}</span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {q.commentCount}
                                  </span>
                                  <span className={`flex items-center gap-1 ${liked ? "text-primary font-medium" : ""}`}>
                                    <ThumbsUp className={`h-3 w-3 ${liked ? "fill-current" : ""}`} />
                                    {likeCount}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-shrink-0 text-muted-foreground mt-1">
                                {isLoadingThis
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : isExpanded
                                  ? <ChevronUp className="h-4 w-4 text-primary" />
                                  : <ChevronDown className="h-4 w-4" />
                                }
                              </div>
                            </button>

                            {/* ── Expanded panel ── */}
                            {isExpanded && (
                              <div className="bg-card border-t border-border/60">
                                {isLoadingThis ? (
                                  <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  </div>
                                ) : detail ? (
                                  <>
                                    {/* Question body */}
                                    <div className="px-5 py-5">
                                      {isEditingThis ? (
                                        <div className="space-y-3">
                                          <input
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            placeholder="제목"
                                          />
                                          <textarea
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none leading-7"
                                            value={editContent}
                                            onChange={e => setEditContent(e.target.value)}
                                            rows={7}
                                            placeholder="내용"
                                          />
                                          <div className="flex gap-2">
                                            <Button size="sm" onClick={() => saveQuestion(q.id)} disabled={savingQuestion} className="gap-1.5">
                                              {savingQuestion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}저장
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingQuestionId(null)} className="gap-1.5">
                                              <X className="h-3.5 w-3.5" />취소
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {/* Content */}
                                          <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90 m-0">
                                              {detail.content}
                                            </p>
                                          </div>

                                          {/* Action bar */}
                                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => handleLike(q.id)}
                                                disabled={!isLoggedIn}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                                  liked
                                                    ? "border-primary/30 bg-primary/10 text-primary"
                                                    : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                title={isLoggedIn ? "" : "로그인 후 이용 가능"}
                                              >
                                                <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                                                <span>{likeCount}</span>
                                              </button>
                                              <button
                                                onClick={() => commentRefs.current[q.id]?.focus()}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:border-border/80 hover:text-foreground transition-all"
                                              >
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                <span>댓글 {detail.commentCount}</span>
                                              </button>
                                            </div>

                                            {isMyQuestion(detail.authorId, detail.authorName) && (
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                  onClick={() => startEditQuestion(detail)}
                                                >
                                                  <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                  onClick={() => deleteQuestion(q.id)}
                                                  disabled={deletingQuestionId === q.id}
                                                >
                                                  {deletingQuestionId === q.id
                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    : <Trash2 className="h-3.5 w-3.5" />
                                                  }
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Comments section */}
                                    <div className="border-t border-border/50 bg-muted/20">
                                      {detail.comments.filter(c => !c.deleted).length > 0 && (
                                        <div className="px-5 pt-4 pb-3 space-y-3">
                                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                            댓글 {detail.comments.filter(c => !c.deleted).length}개
                                          </p>
                                          {detail.comments.map(c => {
                                            if (c.deleted) return null
                                            return (
                                              <div key={c.id} className="group">
                                                <div className="flex-1 min-w-0">
                                                  {editingComment?.cid === c.id ? (
                                                    <div className="space-y-2">
                                                      <textarea
                                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                                        value={editCommentContent}
                                                        onChange={e => setEditCommentContent(e.target.value)}
                                                        rows={2}
                                                        autoFocus
                                                      />
                                                      <div className="flex gap-2">
                                                        <Button size="sm" onClick={saveComment} disabled={savingComment} className="h-7 gap-1 text-xs px-3">
                                                          {savingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}저장
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => setEditingComment(null)} className="h-7 gap-1 text-xs px-3">
                                                          <X className="h-3 w-3" />취소
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="rounded-xl bg-background border border-border/60 px-3.5 py-2.5">
                                                      <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-xs font-semibold text-foreground">{c.authorName}</span>
                                                          <span className="text-xs text-muted-foreground">{c.timeAgo}</span>
                                                        </div>
                                                        {isMyComment(c.authorId, c.authorName) && (
                                                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                              onClick={() => startEditComment(q.id, c.id, c.content)}
                                                            >
                                                              <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                              onClick={() => deleteComment(q.id, c.id)}
                                                              disabled={deletingCommentId === c.id}
                                                            >
                                                              {deletingCommentId === c.id
                                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                : <Trash2 className="h-3 w-3" />
                                                              }
                                                            </Button>
                                                          </div>
                                                        )}
                                                      </div>
                                                      <p className="text-sm text-foreground/80 leading-relaxed">{c.content}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}

                                      {/* Comment input */}
                                      <div className="px-5 py-4">
                                        {isLoggedIn ? (
                                          <div className="flex gap-2 items-end">
                                              <textarea
                                                ref={el => { commentRefs.current[q.id] = el }}
                                                value={commentInputs[q.id] ?? ""}
                                                onChange={e => setCommentInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                placeholder="댓글을 입력하세요... (Ctrl+Enter로 등록)"
                                                rows={1}
                                                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[40px]"
                                                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment(q.id) }}
                                              />
                                              <Button
                                                onClick={() => handleComment(q.id)}
                                                disabled={!(commentInputs[q.id] ?? "").trim() || submittingComment === q.id}
                                                size="sm"
                                                className="gap-1.5 h-10 px-4"
                                              >
                                                {submittingComment === q.id
                                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                                  : <Send className="h-4 w-4" />
                                                }
                                                <span className="hidden sm:inline">등록</span>
                                              </Button>
                                          </div>
                                        ) : (
                                          <p className="text-center text-sm text-muted-foreground py-2">
                                            <Link href="/login" className="text-primary font-medium hover:underline">로그인</Link>하면 댓글을 남길 수 있습니다
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-8">내용을 불러올 수 없습니다.</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground font-mono px-2">{page + 1} / {totalPages}</span>
                      <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
