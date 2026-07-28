import { and, asc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { cards, lists } from "@/db/schema"
import { requireBoardMember } from "@/lib/authz/guards"

export async function getBoardContents(boardId: string, requestingUserId: string) {
  await requireBoardMember(boardId, requestingUserId)
  const db = getDb()

  const [listRows, cardRows] = await Promise.all([
    db
      .select({ id: lists.id, name: lists.name, sortKey: lists.sortKey })
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
  ])

  return { lists: listRows, cards: cardRows }
}
