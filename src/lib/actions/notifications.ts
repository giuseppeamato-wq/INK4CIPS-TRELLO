"use server"

import { and, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { notifications } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireSession()
  const db = getDb()
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)))
}

export async function markAllNotificationsReadAction() {
  const session = await requireSession()
  const db = getDb()
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)))
}
