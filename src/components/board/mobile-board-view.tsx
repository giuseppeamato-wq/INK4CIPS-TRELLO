"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { MoreHorizontal, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createListAction, deleteListAction, moveListAction, renameListAction } from "@/lib/actions/lists"
import { keyBetween } from "@/lib/ordering/position"
import type { CardT } from "./card-item"
import type { ListT } from "./list-column"
import { MobileCardItem } from "./mobile-card-item"
import { CreateCardForm } from "./create-card-form"

const KIND_DOT_COLOR: Record<string, string> = { todo: "#ef4444", in_progress: "#facc15", done: "#22c55e" }

// Desktop shows every list side by side (drag-and-drop to reorder, a
// dropdown per list to rename/delete, "Aggiungi lista" to create custom
// ones beyond the 3 fixed Da Fare/In Corso/Fatto). Mobile has no room for
// side-by-side columns, so it swaps that for a scrollable tab strip — but
// it needs to expose the exact same set of lists and the exact same
// actions on them, not just the 3 fixed kinds.
export function MobileBoardView({
  boardId,
  lists,
  cards,
  canEdit,
  onCardOpen,
  onCardCreated,
  onListCreated,
  onListRenamed,
  onListDeleted,
  onListMoved,
}: {
  boardId: string
  lists: ListT[]
  cards: CardT[]
  canEdit: boolean
  onCardOpen: (cardId: string) => void
  onCardCreated: (card: CardT) => void
  onListCreated: (list: ListT) => void
  onListRenamed: (listId: string, name: string) => void
  onListDeleted: (listId: string) => void
  onListMoved: (listId: string, sortKey: string) => void
}) {
  const [activeListId, setActiveListId] = useState<string | null>(lists[0]?.id ?? null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [renamingListId, setRenamingListId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null

  const cardCountByList = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of cards) map.set(c.listId, (map.get(c.listId) ?? 0) + 1)
    return map
  }, [cards])

  const activeCards = useMemo(() => {
    if (!activeList) return []
    return cards.filter((c) => c.listId === activeList.id).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
  }, [cards, activeList])

  async function submitNewList() {
    const trimmed = newListName.trim()
    if (!trimmed) {
      setIsAddingList(false)
      return
    }
    setIsCreatingList(true)
    try {
      const sortKey = keyBetween(lists.length ? lists[lists.length - 1].sortKey : null, null)
      const list = await createListAction(boardId, trimmed, sortKey)
      onListCreated({ ...list, kind: null })
      setActiveListId(list.id)
      setNewListName("")
      setIsAddingList(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsCreatingList(false)
    }
  }

  async function saveRename(list: ListT) {
    const trimmed = renameValue.trim()
    setRenamingListId(null)
    if (!trimmed || trimmed === list.name) return
    onListRenamed(list.id, trimmed)
    try {
      await renameListAction(list.id, trimmed)
    } catch (err) {
      onListRenamed(list.id, list.name)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function handleDeleteList(list: ListT) {
    if (!window.confirm(`Eliminare la lista "${list.name}" e tutte le sue card?`)) return
    if (activeListId === list.id) {
      const remaining = lists.filter((l) => l.id !== list.id)
      setActiveListId(remaining[0]?.id ?? null)
    }
    onListDeleted(list.id)
    try {
      await deleteListAction(list.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function handleMoveList(list: ListT, direction: "left" | "right") {
    const idx = lists.findIndex((l) => l.id === list.id)
    const targetIdx = direction === "left" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= lists.length) return
    const reordered = [...lists]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    const newIdx = reordered.findIndex((l) => l.id === list.id)
    const before = reordered[newIdx - 1]?.sortKey ?? null
    const after = reordered[newIdx + 1]?.sortKey ?? null
    const newKey = keyBetween(before, after)
    onListMoved(list.id, newKey)
    try {
      await moveListAction(list.id, newKey)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  const activeIndex = activeList ? lists.findIndex((l) => l.id === activeList.id) : -1

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-[18px] pt-4 pb-2">
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-xl bg-[#f2f2f2] p-1">
          {lists.map((list) =>
            renamingListId === list.id ? (
              <Input
                key={list.id}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => saveRename(list)}
                onKeyDown={(e) => e.key === "Enter" && saveRename(list)}
                autoFocus
                className="h-8 w-32 shrink-0 rounded-[9px] text-[12.5px] font-bold"
              />
            ) : (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-center text-[12.5px] font-bold whitespace-nowrap",
                  activeList?.id === list.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {list.kind && (
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: KIND_DOT_COLOR[list.kind] }}
                  />
                )}
                {list.name} · {cardCountByList.get(list.id) ?? 0}
              </button>
            )
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsAddingList(true)}
            aria-label="Aggiungi lista"
            className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f2f2f2]"
          >
            <Plus className="size-4 text-muted-foreground" />
          </button>
        )}
        {canEdit && activeList && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setRenamingListId(activeList.id)
                  setRenameValue(activeList.name)
                }}
              >
                Rinomina
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={activeIndex <= 0}
                onClick={() => handleMoveList(activeList, "left")}
              >
                Sposta a sinistra
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={activeIndex === -1 || activeIndex >= lists.length - 1}
                onClick={() => handleMoveList(activeList, "right")}
              >
                Sposta a destra
              </DropdownMenuItem>
              {!activeList.kind && (
                <DropdownMenuItem variant="destructive" onClick={() => handleDeleteList(activeList)}>
                  Elimina
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isAddingList && (
        <div className="mx-[18px] mb-2 flex gap-2 rounded-xl border border-border bg-white p-2.5">
          <Input
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nome lista..."
            className="h-9 flex-1 rounded-lg border-[#e5e5e5] bg-[#fafafa] text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewList()
              if (e.key === "Escape") setIsAddingList(false)
            }}
          />
          <Button size="sm" onClick={submitNewList} disabled={isCreatingList}>
            Aggiungi
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingList(false)}>
            Annulla
          </Button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] pt-2.5 pb-[100px]">
        {activeList ? (
          <>
            {activeCards.map((card) => (
              <MobileCardItem key={card.id} card={card} kind={activeList.kind} onOpen={onCardOpen} />
            ))}
            {canEdit && (
              <CreateCardForm
                listId={activeList.id}
                lastSortKey={activeCards.length ? activeCards[activeCards.length - 1].sortKey : null}
                onCreated={onCardCreated}
              />
            )}
          </>
        ) : (
          <p className="pt-8 text-center text-sm text-muted-foreground">Nessuna lista ancora.</p>
        )}
      </div>
    </div>
  )
}
