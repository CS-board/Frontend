import { DesktopHome } from "@/components/features/desktop/desktop-home"
import { MobileHome } from "@/components/features/mobile/mobile-home"

export default function HomePage() {
  return (
    <>
      {/* Desktop Version - Dashboard layout with sidebar */}
      <div className="hidden md:block">
        <DesktopHome />
      </div>

      {/* Mobile Version - Card-based layout with bottom tab bar */}
      <div className="block md:hidden">
        <MobileHome />
      </div>
    </>
  )
}
