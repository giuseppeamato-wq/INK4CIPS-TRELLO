import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { notifications } from "@/db/schema"

export async function getRecentNotifications(userId: string, limit = 30) {
  const db = getDb()
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
}

export async function getUnreadNotificationCount(userId: string) {
  const db = getDb()
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
  return rows.length
}
