import Link from "next/link"
import { Mail } from "lucide-react"

const MEMBERS: { name: string; role: string }[] = [
  // 필요 시 관계자 추가: { name: "홍길동", role: "운영" }
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="w-full px-6 py-10 md:px-8 lg:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

          {/* 좌측: 브랜딩 */}
          <div className="space-y-2">
            <div className="font-mono text-base font-bold text-foreground tracking-tight">
              CHIP_SAT
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              국립금오공과대학교 컴퓨터공학부
            </p>
            {MEMBERS.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                {MEMBERS.map(({ name, role }) => (
                  <span key={name} className="text-xs text-muted-foreground">
                    {role} {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 문의 */}
          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">문의사항</p>
            <Link
              href="mailto:totoro7378@kumoh.ac.kr"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              totoro7378@kumoh.ac.kr
            </Link>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 CHIP_SAT · 국립금오공과대학교 컴퓨터공학부 · All rights reserved.
        </div>
      </div>
    </footer>
  )
}
