"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { moveListAction } from "@/lib/actions/lists"
import { moveCardAction } from "@/lib/actions/cards"
import { keyBetween } from "@/lib/ordering/position"
import type { CardStatusSync } from "@/lib/checklist-status"
import { useBoardRealtime } from "@/lib/realtime/use-board-realtime"
import { useIsMobile } from "@/hooks/use-mobile"
import { ListColumn, type ListT } from "./list-column"
import { CardItem, type CardT } from "./card-item"
import { CreateListForm } from "./create-list-form"
import { MobileBoardView } from "./mobile-board-view"
import { CardModal } from "@/components/card-detail/card-modal"

export function BoardCanvas({
  boardId,
  initialLists,
  initialCards,
  canEdit,
}: {
  boardId: string
  initialLists: ListT[]
  initialCards: CardT[]
  canEdit: boolean
}) {
  const [lists, setLists] = useState(initialLists)
  const [cards, setCards] = useState(initialCards)
  const [activeCard, setActiveCard] = useState<CardT | null>(null)
  const [activeList, setActiveList] = useState<ListT | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const openCardId = searchParams.get("card")

  function openCard(cardId: string) {
    router.push(`?card=${cardId}`, { scroll: false })
  }

  function closeCard() {
    router.push("?", { scroll: false })
  }

  const isMobile = useIsMobile()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  useBoardRealtime(boardId, (event) => {
    switch (event.type) {
      case "list.created":
        setLists((prev) =>
          prev.some((l) => l.id === event.list.id) ? prev : [...prev, { ...event.list, kind: null }]
        )
        break
      case "list.moved":
        setLists((prev) =>
          prev.map((l) => (l.id === event.listId ? { ...l, sortKey: event.sortKey } : l))
        )
        break
      case "card.created":
        setCards((prev) =>
          prev.some((c) => c.id === event.card.id)
            ? prev
            : [
                ...prev,
                {
                  ...event.card,
                  dueDate: event.card.dueDate ? new Date(event.card.dueDate) : null,
                  labels: [],
                },
              ]
        )
        break
      case "card.moved":
        setCards((prev) =>
          prev.map((c) =>
            c.id === event.cardId ? { ...c, listId: event.listId, sortKey: event.sortKey } : c
          )
        )
        break
      case "list.renamed":
        setLists((prev) => prev.map((l) => (l.id === event.listId ? { ...l, name: event.name } : l)))
        break
      case "list.deleted":
        setLists((prev) => prev.filter((l) => l.id !== event.listId))
        setCards((prev) => prev.filter((c) => c.listId !== event.listId))
        break
      case "card.renamed":
        setCards((prev) =>
          prev.map((c) => (c.id === event.cardId ? { ...c, title: event.title } : c))
        )
        break
      case "card.deleted":
        setCards((prev) => prev.filter((c) => c.id !== event.cardId))
        break
    }
  })

  const sortedLists = useMemo(() => [...lists].sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1)), [lists])
  const cardsByList = useMemo(() => {
    const map = new Map<string, CardT[]>()
    for (const list of sortedLists) map.set(list.id, [])
    for (const card of [...cards].sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))) {
      map.get(card.listId)?.push(card)
    }
    return map
  }, [sortedLists, cards])

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current
    if (data?.type === "card") {
      setActiveCard(cards.find((c) => c.id === event.active.id) ?? null)
    } else if (data?.type === "list") {
      setActiveList(lists.find((l) => l.id === event.active.id) ?? null)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeData = active.data.current
    if (activeData?.type !== "card") return

    const overData = over.data.current
    const targetListId =
      overData?.type === "card" ? (overData.listId as string)
      : overData?.type === "list-container" ? (overData.listId as string)
      : null
    if (!targetListId) return

    setCards((prev) => {
      const activeCardRow = prev.find((c) => c.id === active.id)
      if (!activeCardRow || activeCardRow.listId === targetListId) return prev
      return prev.map((c) => (c.id === active.id ? { ...c, listId: targetListId } : c))
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    setActiveList(null)
    if (!over) return

    const activeData = active.data.current

    if (activeData?.type === "list") {
      // `over` may be the list itself, or (since lists contain cards and a
      // droppable card container) a card / list-container within it — in
      // every case, resolve back to the list id being hovered.
      const overData = over.data.current
      const overListId =
        overData?.type === "list" ? (over.id as string)
        : overData?.type === "card" ? (overData.listId as string)
        : overData?.type === "list-container" ? (overData.listId as string)
        : null
      if (!overListId) return

      const oldIndex = sortedLists.findIndex((l) => l.id === active.id)
      const newIndex = sortedLists.findIndex((l) => l.id === overListId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(sortedLists, oldIndex, newIndex)
      const idx = reordered.findIndex((l) => l.id === active.id)
      const before = reordered[idx - 1]?.sortKey ?? null
      const after = reordered[idx + 1]?.sortKey ?? null
      const newKey = keyBetween(before, after)

      setLists((prev) => prev.map((l) => (l.id === active.id ? { ...l, sortKey: newKey } : l)))
      moveListAction(active.id as string, newKey).catch((err) => {
        toast.error(err instanceof Error ? err.message : "Errore nello spostamento della lista")
      })
      return
    }

    if (activeData?.type === "card") {
      const activeCardId = active.id as string
      const current = cards.find((c) => c.id === activeCardId)
      if (!current) return

      const overData = over.data.current
      const siblings = cards
        .filter((c) => c.listId === current.listId && c.id !== activeCardId)
        .sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))

      let overIndex = siblings.length
      if (overData?.type === "card") {
        const idx = siblings.findIndex((c) => c.id === over.id)
        if (idx !== -1) overIndex = idx
      }

      const before = siblings[overIndex - 1]?.sortKey ?? null
      const after = siblings[overIndex]?.sortKey ?? null
      const newKey = keyBetween(before, after)

      setCards((prev) => prev.map((c) => (c.id === activeCardId ? { ...c, sortKey: newKey } : c)))
      moveCardAction(activeCardId, current.listId, newKey).catch((err) => {
        toast.error(err instanceof Error ? err.message : "Errore nello spostamento della card")
      })
    }
  }

  const openCard_ = openCardId ? cards.find((c) => c.id === openCardId) : null
  const openCardKind = openCard_
    ? sortedLists.find((l) => l.id === openCard_.listId)?.kind
    : null

  // Mobile has no drag-and-drop, so the card modal offers an explicit
  // "Sposta in" list picker instead — appends the card at the end of the
  // target list, mirroring handleDragEnd's card-move branch above.
  function handleCardMoved(cardId: string, targetListId: string) {
    const current = cards.find((c) => c.id === cardId)
    if (!current || current.listId === targetListId) return
    const siblings = cards
      .filter((c) => c.listId === targetListId)
      .sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
    const newKey = keyBetween(siblings.length ? siblings[siblings.length - 1].sortKey : null, null)
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, listId: targetListId, sortKey: newKey } : c)))
    moveCardAction(cardId, targetListId, newKey).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Errore nello spostamento della card")
    })
  }

  // Same idea for reordering a card within its own list — desktop does
  // this with drag-and-drop, mobile gets an explicit up/down swap instead.
  function handleCardReorder(cardId: string, direction: "up" | "down") {
    const current = cards.find((c) => c.id === cardId)
    if (!current) return
    const siblings = cards
      .filter((c) => c.listId === current.listId)
      .sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
    const idx = siblings.findIndex((c) => c.id === cardId)
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= siblings.length) return

    const reordered = [...siblings]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    const newIdx = reordered.findIndex((c) => c.id === cardId)
    const before = reordered[newIdx - 1]?.sortKey ?? null
    const after = reordered[newIdx + 1]?.sortKey ?? null
    const newKey = keyBetween(before, after)

    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, sortKey: newKey } : c)))
    moveCardAction(cardId, current.listId, newKey).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Errore nello spostamento della card")
    })
  }

  // The checklist-driven auto column (Da Fare/In Corso/Fatto) and the
  // done/total badge already happened server-side by the time this fires —
  // this just reflects that outcome in this tab's own state immediately,
  // rather than waiting on the board-level realtime broadcast that updates
  // every *other* open view (and doesn't carry checklist counts at all).
  function handleCardStatusSynced(cardId: string, status: NonNullable<CardStatusSync>) {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              checklist: { done: status.done, total: status.total },
              ...(status.moved ? { listId: status.moved.listId, sortKey: status.moved.sortKey } : {}),
            }
          : c
      )
    )
  }

  if (isMobile) {
    return (
      <>
        <MobileBoardView
          boardId={boardId}
          lists={sortedLists}
          cards={cards}
          canEdit={canEdit}
          onCardOpen={openCard}
          onCardCreated={(card) =>
            setCards((prev) => (prev.some((c) => c.id === card.id) ? prev : [...prev, card]))
          }
          onListCreated={(list) =>
            setLists((prev) => (prev.some((l) => l.id === list.id) ? prev : [...prev, list]))
          }
          onListRenamed={(listId, name) =>
            setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name } : l)))
          }
          onListDeleted={(listId) => {
            setLists((prev) => prev.filter((l) => l.id !== listId))
            setCards((prev) => prev.filter((c) => c.listId !== listId))
          }}
          onListMoved={(listId, sortKey) =>
            setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, sortKey } : l)))
          }
        />
        {openCardId && (
          <CardModal
            key={openCardId}
            cardId={openCardId}
            boardId={boardId}
            canEdit={canEdit}
            cardKind={openCardKind}
            lists={sortedLists}
            onOpenChange={(open) => {
              if (!open) closeCard()
            }}
            onTitleChanged={(cardId, title) =>
              setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, title } : c)))
            }
            onDeleted={(cardId) => {
              setCards((prev) => prev.filter((c) => c.id !== cardId))
              closeCard()
            }}
            onCardMoved={handleCardMoved}
            onCardReorder={handleCardReorder}
            onCardStatusSynced={handleCardStatusSynced}
          />
        )}
      </>
    )
  }

  return (
    <DndContext
      id={`board-${boardId}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-5 overflow-x-auto bg-background p-[22px] md:px-9">
        <SortableContext items={sortedLists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          {sortedLists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              cards={cardsByList.get(list.id) ?? []}
              canEdit={canEdit}
              onCardCreated={(card) =>
                setCards((prev) => (prev.some((c) => c.id === card.id) ? prev : [...prev, card]))
              }
              onCardOpen={openCard}
              onRenamed={(listId, name) =>
                setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name } : l)))
              }
              onDeleted={(listId) => {
                setLists((prev) => prev.filter((l) => l.id !== listId))
                setCards((prev) => prev.filter((c) => c.listId !== listId))
              }}
            />
          ))}
        </SortableContext>
        <CreateListForm
          boardId={boardId}
          lastSortKey={sortedLists.length ? sortedLists[sortedLists.length - 1].sortKey : null}
          onCreated={(list) =>
            setLists((prev) => (prev.some((l) => l.id === list.id) ? prev : [...prev, list]))
          }
        />
      </div>
      <DragOverlay>
        {activeCard ? (
          <CardItem
            card={activeCard}
            kind={sortedLists.find((l) => l.id === activeCard.listId)?.kind}
          />
        ) : null}
        {activeList ? (
          <div className="w-72 rounded-xl bg-card/90 p-2.5 text-sm font-medium shadow-lg shadow-black/20 backdrop-blur-sm">
            {activeList.name}
          </div>
        ) : null}
      </DragOverlay>
      {openCardId && (
        <CardModal
          key={openCardId}
          cardId={openCardId}
          boardId={boardId}
          canEdit={canEdit}
          cardKind={openCardKind}
          lists={sortedLists}
          onOpenChange={(open) => {
            if (!open) closeCard()
          }}
          onTitleChanged={(cardId, title) =>
            setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, title } : c)))
          }
          onDeleted={(cardId) => {
            setCards((prev) => prev.filter((c) => c.id !== cardId))
            closeCard()
          }}
          onCardMoved={handleCardMoved}
          onCardStatusSynced={handleCardStatusSynced}
        />
      )}
    </DndContext>
  )
}
