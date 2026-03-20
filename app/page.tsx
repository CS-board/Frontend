/** 홈: 데스크톱(사이드바 레이아웃) / 모바일(풀스크롤 섹션) 분기 */
import { DesktopHome } from "@/components/features/desktop/desktop-home"
import { MobileHome } from "@/components/features/mobile/mobile-home"

export default function HomePage() {
  return (
    <>
      <div className="hidden md:block">
        <DesktopHome />
      </div>

      <div className="block md:hidden">
        <MobileHome />
      </div>
    </>
  )
}
