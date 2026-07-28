import { and, asc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { boards } from "@/db/schema"
import { ForbiddenError, requireBoardMember, requireWorkspaceMember } from "@/lib/authz/guards"

export async function getBoardsForWorkspace(workspaceId: string, requestingUserId: string) {
  await requireWorkspaceMember(workspaceId, requestingUserId)
  const db = getDb()
  return db
    .select({ id: boards.id, name: boards.name, background: boards.background, createdAt: boards.createdAt })
    .from(boards)
    .where(and(eq(boards.workspaceId, workspaceId), eq(boards.archived, false)))
    .orderBy(asc(boards.createdAt))
}

export async function getBoardById(boardId: string, requestingUserId: string) {
  try {
    await requireBoardMember(boardId, requestingUserId)
  } catch (err) {
    if (err instanceof ForbiddenError) return null
    throw err
  }
  const db = getDb()
  const [board] = await db
    .select({
      id: boards.id,
      workspaceId: boards.workspaceId,
      name: boards.name,
      background: boards.background,
      archived: boards.archived,
      createdAt: boards.createdAt,
    })
    .from(boards)
    .where(eq(boards.id, boardId))

  return board ?? null
}
