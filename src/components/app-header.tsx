"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutButton } from "@/components/auth/logout-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationBell, type NotificationT } from "@/components/notifications/notification-bell"

// Workspace/board pages already render their own branded sidebar (logo,
// nav, profile row), so this bar would just duplicate it on desktop — it
// only needs to show there on mobile, which has no sidebar. Pages outside
// the workspace shell (profile, home) still get the full desktop bar since
// they have no other way back to a workspace or to log out.
export function AppHeader({
  userEmail,
  userLabel,
  notifications,
  unreadCount,
}: {
  userEmail: string
  userLabel: string
  notifications: NotificationT[]
  unreadCount: number
}) {
  const pathname = usePathname()
  const isWorkspaceShell = pathname.startsWith("/w/")

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b px-4",
        isWorkspaceShell && "md:hidden"
      )}
    >
      <Link href="/" className="truncate font-heading text-sm font-semibold">
        INK4CIPS
      </Link>
      <div className="hidden items-center gap-3 md:flex">
        <span className="truncate text-sm text-muted-foreground">{userEmail}</span>
        <LogoutButton />
      </div>
      <div className="flex items-center gap-2.5 md:hidden">
        <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />
        <Link href="/profile" aria-label="Profilo">
          <Avatar size="sm">
            <AvatarFallback>{userLabel}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
