"use server"

import { and, eq, ne } from "drizzle-orm"
import { getDb } from "@/db"
import {
  boards,
  cardLabels,
  cardMembers,
  cards,
  checklistItems,
  checklists,
  comments,
  labels,
  workspaces,
} from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import {
  getCardBoardId,
  getChecklistCardId,
  getChecklistItemChecklistId,
  requireBoardMember,
  requireCardEditor,
  requireCardMember,
  requireChecklistItemMember,
  requireChecklistMember,
} from "@/lib/authz/guards"
import { getBoardLabels, getBoardMembers, getCardDetail } from "@/lib/queries/card-detail"
import { syncCardStatusFromChecklist } from "@/lib/checklist-status"
import { broadcastToBoard } from "@/lib/realtime/broadcast"
import { createNotification } from "@/lib/notifications/create"

async function getCardNotificationContext(db: ReturnType<typeof getDb>, cardId: string) {
  const [row] = await db
    .select({ title: cards.title, boardId: cards.boardId, workspaceSlug: workspaces.slug })
    .from(cards)
    .innerJoin(boards, eq(cards.boardId, boards.id))
    .innerJoin(workspaces, eq(boards.workspaceId, workspaces.id))
    .where(eq(cards.id, cardId))
  if (!row) return null
  return { ...row, url: `/w/${row.workspaceSlug}/b/${row.boardId}?card=${cardId}` }
}

export async function getCardDetailAction(cardId: string) {
  const session = await requireSession()
  return getCardDetail(cardId, session.user.id)
}

export async function getCardPickersAction(boardId: string) {
  const session = await requireSession()
  const [members, boardLabels] = await Promise.all([
    getBoardMembers(boardId, session.user.id),
    getBoardLabels(boardId, session.user.id),
  ])
  return { members, labels: boardLabels }
}

export async function updateCardTitleAction(cardId: string, title: string) {
  const session = await requireSession()
  await requireCardEditor(cardId, session.user.id)
  const db = getDb()
  await db.update(cards).set({ title, updatedAt: new Date() }).where(eq(cards.id, cardId))

  const boardId = await getCardBoardId(cardId)
  if (boardId) {
    await broadcastToBoard(boardId, { type: "card.renamed", cardId, title }).catch(() => {})
  }
}

export async function updateCardDescriptionAction(cardId: string, description: string) {
  const session = await requireSession()
  await requireCardMember(cardId, session.user.id)
  const db = getDb()
  await db.update(cards).set({ description, updatedAt: new Date() }).where(eq(cards.id, cardId))
}

export async function updateCardDueDateAction(cardId: string, dueDate: Date | null) {
  const session = await requireSession()
  await requireCardMember(cardId, session.user.id)
  const db = getDb()
  await db.update(cards).set({ dueDate, updatedAt: new Date() }).where(eq(cards.id, cardId))
}

export async function toggleCardMemberAction(cardId: string, userId: string) {
  const session = await requireSession()
  await requireCardMember(cardId, session.user.id)
  await requireCardMember(cardId, userId) // the assignee must also be a board member

  const db = getDb()
  const [existing] = await db
    .select()
    .from(cardMembers)
    .where(and(eq(cardMembers.cardId, cardId), eq(cardMembers.userId, userId)))

  if (existing) {
    await db.delete(cardMembers).where(and(eq(cardMembers.cardId, cardId), eq(cardMembers.userId, userId)))
    return { assigned: false }
  }
  await db.insert(cardMembers).values({ cardId, userId })

  if (userId !== session.user.id) {
    const ctx = await getCardNotificationContext(db, cardId)
    if (ctx) {
      await createNotification({
        userId,
        type: "card_assigned",
        message: `${session.user.name} ti ha assegnato alla card "${ctx.title}"`,
        url: ctx.url,
      }).catch(() => {})
    }
  }

  return { assigned: true }
}

export async function createLabelAction(boardId: string, name: string, color: string) {
  const session = await requireSession()
  await requireBoardMember(boardId, session.user.id)
  const db = getDb()
  const [label] = await db
    .insert(labels)
    .values({ boardId, name, color })
    .returning({ id: labels.id, name: labels.name, color: labels.color })
  return label
}

export async function toggleCardLabelAction(cardId: string, labelId: string) {
  const session = await requireSession()
  await requireCardMember(cardId, session.user.id)

  const db = getDb()
  const [existing] = await db
    .select()
    .from(cardLabels)
    .where(and(eq(cardLabels.cardId, cardId), eq(cardLabels.labelId, labelId)))

  if (existing) {
    await db.delete(cardLabels).where(and(eq(cardLabels.cardId, cardId), eq(cardLabels.labelId, labelId)))
    return { attached: false }
  }
  await db.insert(cardLabels).values({ cardId, labelId })
  return { attached: true }
}

export async function createChecklistAction(cardId: string, title: string, sortKey: string) {
  const session = await requireSession()
  await requireCardMember(cardId, session.user.id)
  const db = getDb()
  const [checklist] = await db
    .insert(checklists)
    .values({ cardId, title, sortKey })
    .returning({ id: checklists.id, title: checklists.title, sortKey: checklists.sortKey })
  return checklist
}

export async function createChecklistItemAction(checklistId: string, text: string, sortKey: string) {
  const session = await requireSession()
  await requireChecklistMember(checklistId, session.user.id)
  const db = getDb()
  const [item] = await db
    .insert(checklistItems)
    .values({ checklistId, text, sortKey })
    .returning({
      id: checklistItems.id,
      checklistId: checklistItems.checklistId,
      text: checklistItems.text,
      isComplete: checklistItems.isComplete,
      sortKey: checklistItems.sortKey,
    })

  const cardId = await getChecklistCardId(checklistId)
  const cardStatus = cardId ? await syncCardStatusFromChecklist(db, cardId) : null

  return { ...item, cardStatus }
}

export async function toggleChecklistItemAction(itemId: string, isComplete: boolean) {
  const session = await requireSession()
  await requireChecklistItemMember(itemId, session.user.id)
  const db = getDb()
  await db.update(checklistItems).set({ isComplete }).where(eq(checklistItems.id, itemId))

  const checklistId = await getChecklistItemChecklistId(itemId)
  const cardId = checklistId ? await getChecklistCardId(checklistId) : null
  const cardStatus = cardId ? await syncCardStatusFromChecklist(db, cardId) : null

  return { cardStatus }
}

export async function deleteChecklistItemAction(itemId: string) {
  const session = await requireSession()
  await requireChecklistItemMember(itemId, session.user.id)
  const db = getDb()

  // Resolved before the delete — once the item row is gone there's no way
  // back to its checklist/card via a join.
  const checklistId = await getChecklistItemChecklistId(itemId)
  const cardId = checklistId ? await getChecklistCardId(checklistId) : null

  await db.delete(checklistItems).where(eq(checklistItems.id, itemId))

  const cardStatus = cardId ? await syncCardStatusFromChecklist(db, cardId) : null
  return { cardStatus }
}

export async function createCommentAction(cardId: string, body: string) {
  const session = await requireSession()
  await requireCardMember(cardId, session.user.id)
  const db = getDb()
  const [comment] = await db
    .insert(comments)
    .values({ cardId, authorId: session.user.id, body })
    .returning({ id: comments.id, body: comments.body, createdAt: comments.createdAt })

  const otherMembers = await db
    .select({ userId: cardMembers.userId })
    .from(cardMembers)
    .where(and(eq(cardMembers.cardId, cardId), ne(cardMembers.userId, session.user.id)))
  if (otherMembers.length) {
    const ctx = await getCardNotificationContext(db, cardId)
    if (ctx) {
      await Promise.all(
        otherMembers.map((m) =>
          createNotification({
            userId: m.userId,
            type: "card_comment",
            message: `${session.user.name} ha commentato "${ctx.title}"`,
            url: ctx.url,
          }).catch(() => {})
        )
      )
    }
  }

  // Comments/checklists/labels aren't part of the board-level realtime feed
  // (that only covers list/card position, see src/durable-objects/board-room.ts) —
  // the card modal itself refetches on open, which is enough for v1.
  return { ...comment, authorId: session.user.id, authorName: session.user.name, authorEmail: session.user.email }
}
