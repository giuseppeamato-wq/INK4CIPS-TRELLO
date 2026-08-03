import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getRecentNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications"
import { AppHeader } from "@/components/app-header"

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
      <AppHeader
        userEmail={session.user.email}
        userLabel={(session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()}
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
