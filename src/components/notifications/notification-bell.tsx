"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import { markAllNotificationsReadAction } from "@/lib/actions/notifications"
import { cn } from "@/lib/utils"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet"

export type NotificationT = {
  id: string
  type: string
  message: string
  url: string | null
  isRead: boolean
  createdAt: Date
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationT[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  async function onOpenChange(open: boolean) {
    if (open && unreadCount > 0) {
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      markAllNotificationsReadAction().catch(() => {})
    }
  }

  return (
    <BottomSheet onOpenChange={onOpenChange}>
      <BottomSheetTrigger
        render={
          <button
            type="button"
            aria-label="Notifiche"
            className="relative flex size-9 items-center justify-center rounded-full bg-muted"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
            )}
          </button>
        }
      />
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Notifiche</BottomSheetTitle>
        </BottomSheetHeader>

        {notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nessuna notifica</p>
        ) : (
          <div className="flex flex-col gap-1 pb-4">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => n.url && router.push(n.url)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl p-3 text-left",
                  !n.isRead && "bg-muted"
                )}
              >
                <span className="text-sm">{n.message}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
                </span>
              </button>
            ))}
          </div>
        )}
      </BottomSheetContent>
    </BottomSheet>
  )
}
