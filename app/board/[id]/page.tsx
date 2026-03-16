"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Pin, Loader2 } from "lucide-react"
import { boardService } from "@/services/board"
import type { BoardPostDetail } from "@/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<BoardPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    boardService.getDetail(Number(id))
      .then(setPost)
      .catch(e => setError(e instanceof Error ? e.message : "게시글을 불러오는데 실패했습니다"))
      .finally(() => setLoading(false))
  }, [id])

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
              <Link href="/board"><ChevronLeft className="h-4 w-4" /> 목록으로</Link>
            </Button>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
                {error}
              </div>
            ) : post ? (
              <Card>
                <CardHeader className="space-y-3">
                  <div className="flex items-start gap-3">
                    {post.pinned && <Pin className="h-5 w-5 text-primary mt-1 flex-shrink-0" fill="currentColor" />}
                    <div className="space-y-1">
                      <CardTitle className="text-2xl leading-snug">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(post.createdAt)}</span>
                        {post.pinned && <Badge variant="outline">공지</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-7">
                    {post.content}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
