import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getRecentNotifications } from "@/lib/queries/notifications"
import { NotificationsList } from "@/components/notifications/notifications-list"

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const notifications = await getRecentNotifications(session.user.id, 100)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col p-5">
      <div className="mb-2 flex items-center gap-3.5">
        <Link
          href="/profile"
          aria-label="Torna al profilo"
          className="flex size-9 items-center justify-center rounded-[9px] bg-ink-soft"
        >
          <ChevronLeft className="size-4 text-foreground" />
        </Link>
        <h1 className="font-heading text-[19px] font-bold text-foreground">Notifiche</h1>
      </div>

      {notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nessuna notifica</p>
      ) : (
        <NotificationsList initialNotifications={notifications} />
      )}
    </div>
  )
}
