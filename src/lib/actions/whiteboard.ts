"use server"

import { getDb } from "@/db"
import { boardWhiteboards } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import { requireBoardMember } from "@/lib/authz/guards"
import type { WhiteboardData } from "@/lib/queries/whiteboard"

export async function saveBoardWhiteboardAction(boardId: string, data: WhiteboardData) {
  const session = await requireSession()
  await requireBoardMember(boardId, session.user.id)

  const db = getDb()
  const json = JSON.stringify(data)
  await db
    .insert(boardWhiteboards)
    .values({ boardId, data: json, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: boardWhiteboards.boardId,
      set: { data: json, updatedAt: new Date() },
    })
}
