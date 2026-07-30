"use server"

import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { boards, lists } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import { requireBoardEditor, requireWorkspaceMember } from "@/lib/authz/guards"
import { DEFAULT_BOARD_BACKGROUND_ID } from "@/lib/board-backgrounds"
import { LIST_KIND_INFO, LIST_KIND_ORDER } from "@/lib/list-kinds"
import { nKeysBetween } from "@/lib/ordering/position"

export async function createBoardAction(workspaceId: string, name: string, background: string) {
  const session = await requireSession()
  await requireWorkspaceMember(workspaceId, session.user.id)

  const db = getDb()
  const [board] = await db
    .insert(boards)
    .values({ workspaceId, name, background: background || DEFAULT_BOARD_BACKGROUND_ID, createdBy: session.user.id })
    .returning({ id: boards.id, name: boards.name })

  const sortKeys = nKeysBetween(null, null, LIST_KIND_ORDER.length)
  await db.insert(lists).values(
    LIST_KIND_ORDER.map((kind, i) => ({
      boardId: board.id,
      name: LIST_KIND_INFO[kind].name,
      sortKey: sortKeys[i],
      kind,
    }))
  )

  return board
}

export async function renameBoardAction(boardId: string, name: string) {
  const session = await requireSession()
  await requireBoardEditor(boardId, session.user.id)

  const db = getDb()
  await db.update(boards).set({ name }).where(eq(boards.id, boardId))
}

export async function updateBoardBackgroundAction(boardId: string, backgroundId: string) {
  const session = await requireSession()
  await requireBoardEditor(boardId, session.user.id)

  const db = getDb()
  await db.update(boards).set({ background: backgroundId }).where(eq(boards.id, boardId))
}

export async function deleteBoardAction(boardId: string) {
  const session = await requireSession()
  await requireBoardEditor(boardId, session.user.id)

  const db = getDb()
  // Cascades to lists/cards/labels/checklists/comments/attachments (D1 rows
  // only — any R2 objects for this board's attachments are orphaned, cheap
  // enough to accept for v1 rather than fetching+bulk-deleting them here).
  await db.delete(boards).where(eq(boards.id, boardId))
}
