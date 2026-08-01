import { and, eq, inArray, ne } from "drizzle-orm"
import { getDb } from "@/db"
import { boards, cardMembers, cards, workspaceMembers } from "@/db/schema"

export async function getProfileStats(userId: string) {
  const db = getDb()

  const memberships = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
  const workspaceIds = memberships.map((m) => m.workspaceId)

  if (!workspaceIds.length) {
    return { boardCount: 0, assignedCardCount: 0, teamCount: 0 }
  }

  const [boardRows, assignedRows, teammateRows] = await Promise.all([
    db
      .select({ id: boards.id })
      .from(boards)
      .where(and(inArray(boards.workspaceId, workspaceIds), eq(boards.archived, false))),
    db
      .select({ cardId: cardMembers.cardId })
      .from(cardMembers)
      .innerJoin(cards, eq(cardMembers.cardId, cards.id))
      .where(and(eq(cardMembers.userId, userId), eq(cards.archived, false))),
    db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(and(inArray(workspaceMembers.workspaceId, workspaceIds), ne(workspaceMembers.userId, userId))),
  ])

  return {
    boardCount: boardRows.length,
    assignedCardCount: assignedRows.length,
    teamCount: new Set(teammateRows.map((r) => r.userId)).size,
  }
}
