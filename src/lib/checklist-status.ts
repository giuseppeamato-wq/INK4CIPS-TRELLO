import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { cards, checklistItems, checklists, lists } from "@/db/schema"
import { keyBetween } from "@/lib/ordering/position"
import { broadcastToBoard } from "@/lib/realtime/broadcast"
import type { ListKind } from "@/lib/list-kinds"

type Db = ReturnType<typeof getDb>

export type CardStatusSync = {
  // Aggregate checklist counts across every checklist on the card — always
  // present when the card has at least one item, so the caller can refresh
  // the done/total badge shown on the collapsed card face (that badge is
  // populated once at board load and otherwise isn't part of the realtime
  // feed, same as comments/labels — see createCommentAction).
  done: number
  total: number
  // Present only when the card's column actually changed.
  moved: { listId: string; sortKey: string } | null
} | null

// Once a card has at least one checklist item, the checklist becomes the
// source of truth for which column it lives in: none checked → Da Fare
// (todo), some but not all → In Corso (in_progress), all checked → Fatto
// (done) — matching the same 3 fixed list kinds every board is created
// with (see createBoardAction), which is why a target list is always found.
// Cards with no checklist items at all are untouched, keeping today's fully
// manual placement. Called after every checklist-item mutation (create,
// toggle, delete) so it applies identically regardless of what changed the
// checklist or which client (desktop/mobile) triggered it — both read this
// same server action.
//
// Returns the new done/total (and, when the card actually moved, its new
// { listId, sortKey }) so the calling action can hand it straight back to
// the client that triggered the change — the board-level WebSocket
// broadcast below covers every *other* open view, but the initiating
// client shouldn't have to wait on a round trip through it (and in local
// dev the Durable Object backing it isn't even available; production only)
// to see its own change.
export async function syncCardStatusFromChecklist(db: Db, cardId: string): Promise<CardStatusSync> {
  const items = await db
    .select({ isComplete: checklistItems.isComplete })
    .from(checklistItems)
    .innerJoin(checklists, eq(checklistItems.checklistId, checklists.id))
    .where(eq(checklists.cardId, cardId))

  if (items.length === 0) return null

  const doneCount = items.filter((i) => i.isComplete).length
  const total = items.length
  const targetKind: ListKind = doneCount === 0 ? "todo" : doneCount === total ? "done" : "in_progress"

  const [card] = await db
    .select({ listId: cards.listId, boardId: cards.boardId })
    .from(cards)
    .where(eq(cards.id, cardId))
  if (!card) return null

  const [targetList] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.boardId, card.boardId), eq(lists.kind, targetKind)))
  // Every board always has exactly one list per fixed kind (they're
  // auto-created and can't be deleted) — if somehow missing, or the card is
  // already there, only the done/total counts changed.
  if (!targetList || targetList.id === card.listId) return { done: doneCount, total, moved: null }

  const [lastCard] = await db
    .select({ sortKey: cards.sortKey })
    .from(cards)
    .where(eq(cards.listId, targetList.id))
    .orderBy(desc(cards.sortKey))
    .limit(1)
  const newSortKey = keyBetween(lastCard?.sortKey ?? null, null)

  await db
    .update(cards)
    .set({ listId: targetList.id, boardId: card.boardId, sortKey: newSortKey, updatedAt: new Date() })
    .where(eq(cards.id, cardId))

  await broadcastToBoard(card.boardId, {
    type: "card.moved",
    cardId,
    listId: targetList.id,
    sortKey: newSortKey,
  }).catch(() => {})

  return { done: doneCount, total, moved: { listId: targetList.id, sortKey: newSortKey } }
}
