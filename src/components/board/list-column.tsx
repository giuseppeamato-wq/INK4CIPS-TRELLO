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
import { CardItem, type CardT } from "./card-item"
import { CreateCardForm } from "./create-card-form"

export type ListT = { id: string; name: string; sortKey: string }

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
        "flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/50 p-2.5",
        isDragging && "opacity-40"
      )}
    >
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
            className="flex-1 cursor-grab truncate px-1 py-0.5 text-sm font-medium active:cursor-grabbing"
          >
            {list.name}
          </div>
        )}
        {canEdit && !editing && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>Rinomina</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div ref={setDroppableRef} className="flex flex-col gap-2 min-h-2">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onOpen={onCardOpen} />
          ))}
        </SortableContext>
      </div>
      <CreateCardForm
        listId={list.id}
        lastSortKey={cards.length ? cards[cards.length - 1].sortKey : null}
        onCreated={onCardCreated}
      />
    </div>
  )
}
