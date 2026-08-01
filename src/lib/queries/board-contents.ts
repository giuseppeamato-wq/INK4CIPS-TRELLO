import { and, asc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { cardLabels, cardMembers, cards, checklistItems, checklists, labels, lists, user } from "@/db/schema"
import { requireBoardMember } from "@/lib/authz/guards"
import type { ListKind } from "@/lib/list-kinds"

export async function getBoardContents(boardId: string, requestingUserId: string) {
  await requireBoardMember(boardId, requestingUserId)
  const db = getDb()

  const [listRows, cardRows, labelRows, checklistItemRows, assigneeRows] = await Promise.all([
    db
      .select({ id: lists.id, name: lists.name, sortKey: lists.sortKey, kind: lists.kind })
      .from(lists)
      .where(and(eq(lists.boardId, boardId), eq(lists.archived, false)))
      .orderBy(asc(lists.sortKey)),
    db
      .select({
        id: cards.id,
        listId: cards.listId,
        title: cards.title,
        sortKey: cards.sortKey,
        dueDate: cards.dueDate,
      })
      .from(cards)
      .where(and(eq(cards.boardId, boardId), eq(cards.archived, false)))
      .orderBy(asc(cards.sortKey)),
    db
      .select({ cardId: cardLabels.cardId, id: labels.id, color: labels.color, name: labels.name })
      .from(cardLabels)
      .innerJoin(cards, eq(cardLabels.cardId, cards.id))
      .innerJoin(labels, eq(cardLabels.labelId, labels.id))
      .where(and(eq(cards.boardId, boardId), eq(cards.archived, false))),
    db
      .select({ cardId: checklists.cardId, isComplete: checklistItems.isComplete })
      .from(checklistItems)
      .innerJoin(checklists, eq(checklistItems.checklistId, checklists.id))
      .innerJoin(cards, eq(checklists.cardId, cards.id))
      .where(and(eq(cards.boardId, boardId), eq(cards.archived, false))),
    db
      .select({ cardId: cardMembers.cardId, userId: cardMembers.userId, name: user.name })
      .from(cardMembers)
      .innerJoin(cards, eq(cardMembers.cardId, cards.id))
      .innerJoin(user, eq(cardMembers.userId, user.id))
      .where(and(eq(cards.boardId, boardId), eq(cards.archived, false))),
  ])

  const labelsByCard = new Map<string, { id: string; color: string; name: string }[]>()
  for (const row of labelRows) {
    const list = labelsByCard.get(row.cardId) ?? []
    list.push({ id: row.id, color: row.color, name: row.name })
    labelsByCard.set(row.cardId, list)
  }

  const checklistByCard = new Map<string, { done: number; total: number }>()
  for (const row of checklistItemRows) {
    const entry = checklistByCard.get(row.cardId) ?? { done: 0, total: 0 }
    entry.total += 1
    if (row.isComplete) entry.done += 1
    checklistByCard.set(row.cardId, entry)
  }

  const assigneesByCard = new Map<string, { userId: string; name: string }[]>()
  for (const row of assigneeRows) {
    const list = assigneesByCard.get(row.cardId) ?? []
    list.push({ userId: row.userId, name: row.name })
    assigneesByCard.set(row.cardId, list)
  }

  return {
    lists: listRows.map((l) => ({ ...l, kind: l.kind as ListKind | null })),
    cards: cardRows.map((c) => ({
      ...c,
      labels: labelsByCard.get(c.id) ?? [],
      checklist: checklistByCard.get(c.id) ?? null,
      assignees: assigneesByCard.get(c.id) ?? [],
    })),
  }
}
