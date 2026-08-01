import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getRecentNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications"
import { LogoutButton } from "@/components/auth/logout-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/notification-bell"

// Every page under (app) reads a live session + live D1 data on every
// request — never statically prerenderable, and getCloudflareContext()'s
// sync mode throws during static generation if Next.js tries anyway.
export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(session.user.id),
    getUnreadNotificationCount(session.user.id),
  ])

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <span className="truncate font-heading text-sm font-semibold">
          INK4CIPS
        </span>
        <div className="hidden items-center gap-3 md:flex">
          <span className="truncate text-sm text-muted-foreground">
            {session.user.email}
          </span>
          <LogoutButton />
        </div>
        <div className="flex items-center gap-2.5 md:hidden">
          <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />
          <Link href="/profile" aria-label="Profilo">
            <Avatar size="sm">
              <AvatarFallback>
                {(session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
