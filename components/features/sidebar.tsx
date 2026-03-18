"use client"

import Image from "next/image"
import { Home, HelpCircle, Trophy, Settings, BarChart3, Newspaper, LogIn, UserPlus, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { userService } from "@/services/user"

const navItems = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Trophy, label: "랭킹", href: "/ranking" },
  { icon: BarChart3, label: "내 기록", href: "/my-record" },
  { icon: HelpCircle, label: "백준 Q&A", href: "/qna" },
  { icon: Newspaper, label: "공지사항", href: "/board" },
  { icon: Settings, label: "설정", href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isLoggedIn, loading } = useAuth()

  const [profileName, setProfileName] = useState<string | null>(null)
  const [profileSub, setProfileSub] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    userService.getDetail()
      .then(d => {
        setProfileName(d.name || null)
        const dept = d.department ?? ""
        const grade = d.grade ? `${d.grade}학년` : ""
        setProfileSub([dept, grade].filter(Boolean).join(" ") || null)
      })
      .catch(() => {
        const dept = user?.department ?? ""
        const grade = user?.grade ? `${user.grade}학년` : ""
        const sub = [dept, grade].filter(Boolean).join(" ")
        setProfileSub(sub || user?.studentId || user?.sub || null)
      })
  }, [isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = profileName ?? user?.name ?? user?.sub?.split("@")[0] ?? "사용자"

  return (
    <aside className="sticky top-0 hidden h-screen w-64 border-r border-border bg-sidebar md:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="CHIP_SAT" width={40} height={40} className="rounded-lg" />
          <div>
            <div className="font-mono text-lg font-bold text-sidebar-foreground">CHIP_SAT</div>
            <div className="text-xs text-sidebar-foreground/60">주간 백준 챌린지</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          {loading ? (
            <div className="h-16 rounded-lg bg-sidebar-accent/30 animate-pulse" />
          ) : isLoggedIn ? (
            <Link href="/settings" className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 hover:bg-sidebar-accent/70 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20 text-sidebar-primary flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">{displayName}</div>
                <div className="truncate text-xs text-sidebar-foreground/60">
                  {profileSub ?? <span className="inline-block w-20 h-3 rounded bg-sidebar-foreground/10 animate-pulse" />}
                </div>
              </div>
            </Link>
          ) : (
            <div className="space-y-2">
              <Button asChild size="sm" className="w-full gap-2">
                <Link href="/login"><LogIn className="h-4 w-4" />로그인</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full gap-2">
                <Link href="/signup"><UserPlus className="h-4 w-4" />회원가입</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
