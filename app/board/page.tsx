"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Footer } from "@/components/features/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pin, Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { boardService } from "@/services/board"
import type { BoardPostListItem, BoardPostDetail } from "@/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}
function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000
}

const PAGE_SIZE = 15

export default function BoardPage() {
  const [posts, setPosts] = useState<BoardPostListItem[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detailCache, setDetailCache] = useState<Record<number, BoardPostDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError("")
    setExpandedId(null)
    boardService.getList(page, PAGE_SIZE)
      .then(r => { setPosts(r.items); setTotalPages(r.totalPages || 1) })
      .catch(e => setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다"))
      .finally(() => setLoading(false))
  }, [page])

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!detailCache[id]) {
      setLoadingDetail(id)
      try {
        const detail = await boardService.getDetail(id)
        setDetailCache(prev => ({ ...prev, [id]: detail }))
      } catch {/* ignore */}
      finally { setLoadingDetail(null) }
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
          <div className="mx-auto max-w-4xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">공지사항</h1>
              <p className="text-muted-foreground mt-2">공지사항 및 챌린지 안내를 확인하세요</p>
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
                <div className="space-y-2">
                  {posts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">게시글이 없습니다</p>
                  ) : posts.map((post) => {
                    const isExpanded = expandedId === post.id
                    const detail = detailCache[post.id]
                    const isLoadingThis = loadingDetail === post.id

                    return (
                      <div key={post.id} className={`rounded-lg border transition-colors ${post.pinned ? "border-primary/40" : "border-border"} ${isExpanded ? "bg-card shadow-sm" : "bg-card hover:bg-muted/40"}`}>
                        {/* Header row */}
                        <button
                          onClick={() => toggleExpand(post.id)}
                          className="w-full text-left px-4 py-4 flex items-center gap-3"
                        >
                          {post.pinned && (
                            <Pin className="h-4 w-4 text-primary flex-shrink-0" fill="currentColor" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-base text-balance">{post.title}</span>
                              {isNew(post.createdAt) && (
                                <Badge variant="destructive" className="text-xs">NEW</Badge>
                              )}
                              {post.pinned && (
                                <Badge variant="outline" className="text-xs border-primary/40 text-primary">공지</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{formatDate(post.createdAt)}</p>
                          </div>
                          <div className="flex-shrink-0 text-muted-foreground">
                            {isLoadingThis
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : isExpanded
                                ? <ChevronUp className="h-4 w-4" />
                                : <ChevronDown className="h-4 w-4" />
                            }
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t border-border px-4 pb-5 pt-4 space-y-2">
                            {isLoadingThis ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : detail ? (
                              <>
                                <p className="text-xs text-muted-foreground">{formatDateTime(detail.createdAt)}</p>
                                <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                                  {detail.content}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">내용을 불러올 수 없습니다.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
