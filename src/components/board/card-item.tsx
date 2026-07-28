"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

export type CardT = {
  id: string
  listId: string
  title: string
  sortKey: string
  dueDate: Date | null
}

export function CardItem({ card, onOpen }: { card: CardT; onOpen?: (cardId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.listId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(card.id)}
      className={cn(
        "cursor-grab rounded-md border bg-card p-2.5 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      {card.title}
    </div>
  )
}
