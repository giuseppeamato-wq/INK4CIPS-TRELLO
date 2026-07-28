"use server"

import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { cards } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import {
  getCardBoardId,
  getListBoardId,
  requireCardEditor,
  requireCardMember,
  requireListMember,
} from "@/lib/authz/guards"
import { broadcastToBoard } from "@/lib/realtime/broadcast"

export async function createCardAction(listId: string, title: string, sortKey: string) {
  const session = await requireSession()
  await requireListMember(listId, session.user.id)

  const boardId = await getListBoardId(listId)
  if (!boardId) throw new Error("List not found")

  const db = getDb()
  const [card] = await db
    .insert(cards)
    .values({ listId, boardId, title, sortKey, createdBy: session.user.id })
    .returning({ id: cards.id, listId: cards.listId, title: cards.title, sortKey: cards.sortKey })

  await broadcastToBoard(boardId, {
    type: "card.created",
    card: { ...card, dueDate: null },
  }).catch(() => {})

  return card
}

export async function moveCardAction(cardId: string, listId: string, sortKey: string) {
  const session = await requireSession()
  await requireCardMember(cardId, session.user.id)
  await requireListMember(listId, session.user.id)

  const boardId = await getListBoardId(listId)
  if (!boardId) throw new Error("List not found")

  const db = getDb()
  await db.update(cards).set({ listId, boardId, sortKey, updatedAt: new Date() }).where(eq(cards.id, cardId))

  await broadcastToBoard(boardId, { type: "card.moved", cardId, listId, sortKey }).catch(() => {})
}

export async function deleteCardAction(cardId: string) {
  const session = await requireSession()
  await requireCardEditor(cardId, session.user.id)

  const boardId = await getCardBoardId(cardId)

  const db = getDb()
  await db.delete(cards).where(eq(cards.id, cardId))

  if (boardId) {
    await broadcastToBoard(boardId, { type: "card.deleted", cardId }).catch(() => {})
  }
}
