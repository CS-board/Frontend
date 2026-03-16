"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, X, Home, HelpCircle, Trophy, Settings, BarChart3, Newspaper, LogIn, UserPlus, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/auth"
import { TOKEN_KEY } from "@/constants"

const navItems = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Trophy, label: "랭킹", href: "/ranking" },
  { icon: BarChart3, label: "내 기록", href: "/my-record" },
  { icon: HelpCircle, label: "백준 Q&A", href: "/qna" },
  { icon: Newspaper, label: "게시판", href: "/board" },
  { icon: Settings, label: "설정", href: "/settings" },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoggedIn, loading } = useAuth()
  const displayName = user?.name ?? user?.sub?.split("@")[0] ?? "사용자"
  const displayId = user?.studentId ?? user?.sub ?? ""

  const handleLogout = async () => {
    try { await authService.logout() } catch {/* ignore */}
    localStorage.removeItem(TOKEN_KEY)
    setIsOpen(false)
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} aria-label="메뉴 열기">
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] border-l border-border bg-background shadow-lg transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
              <Image src="/logo.png" alt="CHIP_SAT" width={28} height={28} className="rounded-md" />
              <span className="font-mono text-base font-bold">CHIP_SAT</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="메뉴 닫기">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="border-b border-border p-4">
            {loading ? (
              <div className="h-16 rounded-lg bg-muted animate-pulse" />
            ) : isLoggedIn ? (
              <Link href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg bg-muted p-3 hover:bg-muted/70 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-bold flex-shrink-0">
                  {displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{displayName}</div>
                  <div className="truncate text-sm text-muted-foreground">{displayId}</div>
                </div>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1 gap-2" onClick={() => setIsOpen(false)}>
                  <Link href="/login"><LogIn className="h-4 w-4" />로그인</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1 gap-2" onClick={() => setIsOpen(false)}>
                  <Link href="/signup"><UserPlus className="h-4 w-4" />회원가입</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {isLoggedIn && (
            <div className="border-t border-border p-4">
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="h-5 w-5" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
