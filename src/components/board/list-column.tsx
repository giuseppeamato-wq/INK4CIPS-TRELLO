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
import type { ListKind } from "@/lib/list-kinds"
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

  const dotColor = list.kind
    ? { todo: "#ef4444", in_progress: "#facc15", done: "#22c55e" }[list.kind]
    : undefined

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn("flex w-[320px] shrink-0 flex-col", isDragging && "opacity-40")}
    >
      <div className="mb-3 flex items-center gap-2">
        {dotColor && <span className="size-2 shrink-0 rounded-full" style={{ background: dotColor }} />}
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            autoFocus
            className="h-7 flex-1 text-[13.5px] font-bold"
          />
        ) : (
          <div
            {...attributes}
            {...listeners}
            className="flex flex-1 cursor-grab items-center gap-2 truncate active:cursor-grabbing"
          >
            <span className="truncate font-heading text-[13.5px] font-bold text-foreground">
              {list.name}
            </span>
            <span className="text-xs font-normal text-ink-faint">{cards.length}</span>
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
      <div ref={setDroppableRef} className="flex min-h-2 flex-1 flex-col gap-2.5 overflow-y-auto pb-2">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} kind={list.kind} onOpen={onCardOpen} />
          ))}
        </SortableContext>
        <CreateCardForm
          listId={list.id}
          lastSortKey={cards.length ? cards[cards.length - 1].sortKey : null}
          onCreated={onCardCreated}
        />
      </div>
    </div>
  )
}
