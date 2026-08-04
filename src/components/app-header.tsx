"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogoutButton } from "@/components/auth/logout-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationBell, type NotificationT } from "@/components/notifications/notification-bell"

// Workspace/board/profile pages render their own header at every breakpoint
// now (the desktop sidebar's profile row, or the mobile workspace bar's own
// avatar button / a page's own back-chevron title), so this bar would just
// duplicate them and is hidden there entirely. Pages with no header of their
// own (e.g. the "/" workspace picker) still get the full bar since they have
// no other way back to a workspace or to log out.
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
  const isWorkspaceShell =
    pathname === "/w" || pathname.startsWith("/w/") || pathname.startsWith("/profile")

  if (isWorkspaceShell) return null

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <Link href="/" className="truncate font-heading text-sm font-semibold">
        INK4CIPS
      </Link>
      <div className="hidden items-center gap-3 md:flex">
        <span className="truncate text-sm text-muted-foreground">{userEmail}</span>
        <LogoutButton compact />
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
