"use client"

import Image from "next/image"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/features/sidebar"
import { MobileMenu } from "@/components/features/mobile-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Loader2 } from "lucide-react"
import { qnaService } from "@/services/qna"

export default function QnaNewPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError("")
    try {
      const res = await qnaService.create(title.trim(), content.trim())
      router.push(`/qna/${res.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "질문 등록에 실패했습니다")
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
          <div className="mx-auto max-w-2xl space-y-6">
            <Button variant="ghost" asChild className="gap-2 -ml-2">
              <Link href="/qna"><ChevronLeft className="h-4 w-4" /> 목록으로</Link>
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>질문하기</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      placeholder="질문 제목을 입력하세요"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">내용</Label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder={"질문 내용을 자세히 작성해주세요.\n문제 번호나 코드가 있다면 함께 작성해주시면 더욱 정확한 도움을 받을 수 있습니다."}
                      rows={12}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/qna">취소</Link>
                    </Button>
                    <Button type="submit" disabled={submitting || !title.trim() || !content.trim()}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      질문 등록
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
