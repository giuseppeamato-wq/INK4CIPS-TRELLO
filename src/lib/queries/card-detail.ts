import { asc, eq, inArray } from "drizzle-orm"
import { getDb } from "@/db"
import {
  attachments,
  boards,
  cardLabels,
  cardMembers,
  cards,
  checklistItems,
  checklists,
  comments,
  labels,
  user,
} from "@/db/schema"
import { requireBoardMember, requireCardMember } from "@/lib/authz/guards"
import { getWorkspaceMembers } from "@/lib/queries/workspaces"

export async function getCardDetail(cardId: string, requestingUserId: string) {
  await requireCardMember(cardId, requestingUserId)
  const db = getDb()

  const [card] = await db
    .select({
      id: cards.id,
      listId: cards.listId,
      boardId: cards.boardId,
      title: cards.title,
      description: cards.description,
      dueDate: cards.dueDate,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .where(eq(cards.id, cardId))

  if (!card) return null

  const [memberRows, labelRows, checklistRows, commentRows, attachmentRows] = await Promise.all([
    db
      .select({ userId: cardMembers.userId, name: user.name, email: user.email, image: user.image })
      .from(cardMembers)
      .innerJoin(user, eq(user.id, cardMembers.userId))
      .where(eq(cardMembers.cardId, cardId)),
    db
      .select({ id: labels.id, name: labels.name, color: labels.color })
      .from(cardLabels)
      .innerJoin(labels, eq(labels.id, cardLabels.labelId))
      .where(eq(cardLabels.cardId, cardId)),
    db
      .select({ id: checklists.id, title: checklists.title, sortKey: checklists.sortKey })
      .from(checklists)
      .where(eq(checklists.cardId, cardId))
      .orderBy(asc(checklists.sortKey)),
    db
      .select({
        id: comments.id,
        body: comments.body,
        createdAt: comments.createdAt,
        authorId: comments.authorId,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(comments)
      .innerJoin(user, eq(user.id, comments.authorId))
      .where(eq(comments.cardId, cardId))
      .orderBy(asc(comments.createdAt)),
    db
      .select({
        id: attachments.id,
        fileName: attachments.fileName,
        contentType: attachments.contentType,
        sizeBytes: attachments.sizeBytes,
        createdAt: attachments.createdAt,
        uploadedBy: attachments.uploadedBy,
      })
      .from(attachments)
      .where(eq(attachments.cardId, cardId))
      .orderBy(asc(attachments.createdAt)),
  ])

  const checklistIds = checklistRows.map((c) => c.id)
  const itemRows = checklistIds.length
    ? await db
        .select({
          id: checklistItems.id,
          checklistId: checklistItems.checklistId,
          text: checklistItems.text,
          isComplete: checklistItems.isComplete,
          sortKey: checklistItems.sortKey,
        })
        .from(checklistItems)
        .where(inArray(checklistItems.checklistId, checklistIds))
        .orderBy(asc(checklistItems.sortKey))
    : []

  const checklistsWithItems = checklistRows.map((checklist) => ({
    ...checklist,
    items: itemRows.filter((i) => i.checklistId === checklist.id),
  }))

  return {
    card,
    members: memberRows,
    labels: labelRows,
    checklists: checklistsWithItems,
    comments: commentRows,
    attachments: attachmentRows,
  }
}

export async function getBoardLabels(boardId: string, requestingUserId: string) {
  await requireBoardMember(boardId, requestingUserId)
  const db = getDb()
  return db.select({ id: labels.id, name: labels.name, color: labels.color }).from(labels).where(eq(labels.boardId, boardId))
}

export async function getBoardMembers(boardId: string, requestingUserId: string) {
  await requireBoardMember(boardId, requestingUserId)
  const db = getDb()
  const [board] = await db.select({ workspaceId: boards.workspaceId }).from(boards).where(eq(boards.id, boardId))
  if (!board) return []
  return getWorkspaceMembers(board.workspaceId, requestingUserId)
}
