"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Footer } from "@/components/features/footer"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pin, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { boardService } from "@/services/board"
import type { BoardPostListItem } from "@/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
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

  useEffect(() => {
    setLoading(true)
    setError("")
    boardService.getList(page, PAGE_SIZE)
      .then(r => { setPosts(r.items); setTotalPages(r.totalPages || 1) })
      .catch(e => setError(e instanceof Error ? e.message : "데이터를 불러오는데 실패했습니다"))
      .finally(() => setLoading(false))
  }, [page])

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
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">게시판</h1>
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
                <div className="space-y-3">
                  {posts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">게시글이 없습니다</p>
                  ) : posts.map((post) => (
                    <Link key={post.id} href={`/board/${post.id}`}>
                      <Card className={`hover:bg-muted/50 transition-colors cursor-pointer ${post.pinned ? "border-primary/50" : ""}`}>
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            {post.pinned && <Pin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" />}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <CardTitle className="text-lg text-balance">{post.title}</CardTitle>
                                {isNew(post.createdAt) && (
                                  <Badge variant="destructive" className="text-xs">NEW</Badge>
                                )}
                              </div>
                              <CardDescription>{formatDate(post.createdAt)}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
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
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
