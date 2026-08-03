"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MoreHorizontal } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { renameListAction, deleteListAction } from "@/lib/actions/lists"
import { LIST_KIND_INFO, type ListKind } from "@/lib/list-kinds"
import { CardItem, type CardT } from "./card-item"
import { CreateCardForm } from "./create-card-form"

export type ListT = { id: string; name: string; sortKey: string; kind: ListKind | null }

export function ListColumn({
  list,
  cards,
  canEdit,
  onCardCreated,
  onCardOpen,
  onRenamed,
  onDeleted,
}: {
  list: ListT
  cards: CardT[]
  canEdit: boolean
  onCardCreated: (card: CardT) => void
  onCardOpen: (cardId: string) => void
  onRenamed: (listId: string, name: string) => void
  onDeleted: (listId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id, data: { type: "list" } })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `list-container-${list.id}`,
    data: { type: "list-container", listId: list.id },
  })

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(list.name)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function saveRename() {
    const trimmed = name.trim()
    setEditing(false)
    if (!trimmed || trimmed === list.name) {
      setName(list.name)
      return
    }
    onRenamed(list.id, trimmed)
    try {
      await renameListAction(list.id, trimmed)
    } catch (err) {
      onRenamed(list.id, list.name)
      setName(list.name)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Eliminare la lista "${list.name}" e tutte le sue card?`)) return
    onDeleted(list.id)
    try {
      await deleteListAction(list.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-card/90 shadow-md shadow-black/20 backdrop-blur-sm",
        isDragging && "opacity-40"
      )}
    >
      {list.kind && <div className={cn("h-1.5 shrink-0", LIST_KIND_INFO[list.kind].barClassName)} />}
      <div className="flex flex-col gap-2 p-2.5">
        <div className="flex items-center gap-1">
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveRename}
              onKeyDown={(e) => e.key === "Enter" && saveRename()}
              autoFocus
              className="h-7 text-sm font-medium"
            />
          ) : (
            <div
              {...attributes}
              {...listeners}
              className="flex flex-1 cursor-grab items-center gap-1.5 truncate px-1 py-0.5 text-sm font-medium active:cursor-grabbing"
            >
              <span className="truncate">{list.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{cards.length}</span>
            </div>
          )}
          {canEdit && !editing && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>Rinomina</DropdownMenuItem>
                {!list.kind && (
                  <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                    Elimina
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div ref={setDroppableRef} className="flex flex-col gap-2 min-h-2">
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <CardItem key={card.id} card={card} kind={list.kind} onOpen={onCardOpen} />
            ))}
          </SortableContext>
        </div>
        <CreateCardForm
          listId={list.id}
          lastSortKey={cards.length ? cards[cards.length - 1].sortKey : null}
          onCreated={onCardCreated}
        />
      </div>
    </div>
  )
}
