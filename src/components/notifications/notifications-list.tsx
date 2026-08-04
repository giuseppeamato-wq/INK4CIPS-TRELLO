"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import { markAllNotificationsReadAction } from "@/lib/actions/notifications"
import { cn } from "@/lib/utils"
import type { NotificationT } from "./notification-bell"

export function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: NotificationT[]
}) {
  const router = useRouter()

  useEffect(() => {
    if (initialNotifications.some((n) => !n.isRead)) {
      markAllNotificationsReadAction().catch(() => {})
    }
    // Mark-all-read once per page visit, matching the mobile bell's behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-1">
      {initialNotifications.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => n.url && router.push(n.url)}
          className={cn(
            "rounded-[12px] border border-border p-3.5 text-left text-[13.5px] text-foreground",
            !n.isRead && "bg-ink-soft"
          )}
        >
          {n.message}
          <span className="mt-0.5 block text-xs text-ink-faint">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
          </span>
        </button>
      ))}
    </div>
  )
}
