import { and, asc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { cardLabels, cards, labels, lists } from "@/db/schema"
import { requireBoardMember } from "@/lib/authz/guards"
import type { ListKind } from "@/lib/list-kinds"

export async function getBoardContents(boardId: string, requestingUserId: string) {
  await requireBoardMember(boardId, requestingUserId)
  const db = getDb()

  const [listRows, cardRows, labelRows] = await Promise.all([
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
      .select({ cardId: cardLabels.cardId, id: labels.id, color: labels.color })
      .from(cardLabels)
      .innerJoin(cards, eq(cardLabels.cardId, cards.id))
      .innerJoin(labels, eq(cardLabels.labelId, labels.id))
      .where(and(eq(cards.boardId, boardId), eq(cards.archived, false))),
  ])

  const labelsByCard = new Map<string, { id: string; color: string }[]>()
  for (const row of labelRows) {
    const list = labelsByCard.get(row.cardId) ?? []
    list.push({ id: row.id, color: row.color })
    labelsByCard.set(row.cardId, list)
  }

  return {
    lists: listRows.map((l) => ({ ...l, kind: l.kind as ListKind | null })),
    cards: cardRows.map((c) => ({ ...c, labels: labelsByCard.get(c.id) ?? [] })),
  }
}
