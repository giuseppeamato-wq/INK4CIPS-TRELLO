"use server"

import { getDb } from "@/db"
import { workspaceWhiteboards } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import { requireWorkspaceMember } from "@/lib/authz/guards"
import type { WhiteboardData } from "@/lib/queries/whiteboard"

export async function saveWorkspaceWhiteboardAction(workspaceId: string, data: WhiteboardData) {
  const session = await requireSession()
  await requireWorkspaceMember(workspaceId, session.user.id)

  const db = getDb()
  const json = JSON.stringify(data)
  await db
    .insert(workspaceWhiteboards)
    .values({ workspaceId, data: json, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: workspaceWhiteboards.workspaceId,
      set: { data: json, updatedAt: new Date() },
    })
}
