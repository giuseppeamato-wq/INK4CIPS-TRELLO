"use server"

import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { lists } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import {
  getListBoardId,
  requireBoardMember,
  requireListEditor,
  requireListMember,
} from "@/lib/authz/guards"
import { broadcastToBoard } from "@/lib/realtime/broadcast"

export async function createListAction(boardId: string, name: string, sortKey: string) {
  const session = await requireSession()
  await requireBoardMember(boardId, session.user.id)

  const db = getDb()
  const [list] = await db
    .insert(lists)
    .values({ boardId, name, sortKey })
    .returning({ id: lists.id, name: lists.name, sortKey: lists.sortKey })

  await broadcastToBoard(boardId, { type: "list.created", list }).catch(() => {})

  return list
}

export async function moveListAction(listId: string, sortKey: string) {
  const session = await requireSession()
  await requireListMember(listId, session.user.id)

  const db = getDb()
  await db.update(lists).set({ sortKey }).where(eq(lists.id, listId))

  const boardId = await getListBoardId(listId)
  if (boardId) {
    await broadcastToBoard(boardId, { type: "list.moved", listId, sortKey }).catch(() => {})
  }
}

export async function renameListAction(listId: string, name: string) {
  const session = await requireSession()
  await requireListEditor(listId, session.user.id)

  const db = getDb()
  await db.update(lists).set({ name }).where(eq(lists.id, listId))

  const boardId = await getListBoardId(listId)
  if (boardId) {
    await broadcastToBoard(boardId, { type: "list.renamed", listId, name }).catch(() => {})
  }
}

export async function deleteListAction(listId: string) {
  const session = await requireSession()
  await requireListEditor(listId, session.user.id)

  const boardId = await getListBoardId(listId)

  const db = getDb()
  await db.delete(lists).where(eq(lists.id, listId))

  if (boardId) {
    await broadcastToBoard(boardId, { type: "list.deleted", listId }).catch(() => {})
  }
}
