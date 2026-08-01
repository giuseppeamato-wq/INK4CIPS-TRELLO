import { getDb } from "@/db"
import { notifications, type NotificationType } from "@/db/schema"

// Best-effort side effect — callers should swallow errors from this (mirrors
// the broadcastToBoard(...).catch(() => {}) pattern) so a notification
// failure never blocks the primary action it's attached to.
export async function createNotification(params: {
  userId: string
  type: NotificationType
  message: string
  url?: string | null
}) {
  const db = getDb()
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    message: params.message,
    url: params.url ?? null,
  })
}
