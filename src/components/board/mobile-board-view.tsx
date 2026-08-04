"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { LIST_KIND_ORDER, LIST_KIND_INFO, type ListKind } from "@/lib/list-kinds"
import type { CardT } from "./card-item"
import type { ListT } from "./list-column"
import { MobileCardItem } from "./mobile-card-item"
import { CreateCardForm } from "./create-card-form"

export function MobileBoardView({
  lists,
  cards,
  canEdit,
  onCardOpen,
  onCardCreated,
}: {
  lists: ListT[]
  cards: CardT[]
  canEdit: boolean
  onCardOpen: (cardId: string) => void
  onCardCreated: (card: CardT) => void
}) {
  const [activeTab, setActiveTab] = useState<ListKind>("todo")

  const listByKind = useMemo(() => {
    const map = new Map<ListKind, ListT>()
    for (const list of lists) {
      if (list.kind) map.set(list.kind, list)
    }
    return map
  }, [lists])

  const cardsByKind = useMemo(() => {
    const map = new Map<ListKind, CardT[]>()
    for (const kind of LIST_KIND_ORDER) {
      const list = listByKind.get(kind)
      const kindCards = list
        ? cards.filter((c) => c.listId === list.id).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
        : []
      map.set(kind, kindCards)
    }
    return map
  }, [cards, listByKind])

  const activeList = listByKind.get(activeTab)
  const activeCards = cardsByKind.get(activeTab) ?? []

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="px-[18px] pt-4 pb-2">
        <div className="flex gap-1 rounded-xl bg-[#f2f2f2] p-1">
          {LIST_KIND_ORDER.map((kind) => (
            <button
              key={kind}
              onClick={() => setActiveTab(kind)}
              className={cn(
                "flex-1 rounded-[9px] py-2 text-center text-[12.5px] font-bold",
                activeTab === kind ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {LIST_KIND_INFO[kind].name} · {cardsByKind.get(kind)?.length ?? 0}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] pt-2.5 pb-[100px]">
        {activeCards.map((card) => (
          <MobileCardItem key={card.id} card={card} kind={activeTab} onOpen={onCardOpen} />
        ))}
        {canEdit && activeList && (
          <CreateCardForm
            listId={activeList.id}
            lastSortKey={activeCards.length ? activeCards[activeCards.length - 1].sortKey : null}
            onCreated={onCardCreated}
          />
        )}
      </div>
    </div>
  )
}
