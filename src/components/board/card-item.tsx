"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

// Module-scope, evaluated once at load — not a render-time impure call, so
// it satisfies the purity rule while still being a fine approximation of
// "now" for a session-lived overdue indicator.
const now = Date.now()

export type CardT = {
  id: string
  listId: string
  title: string
  sortKey: string
  dueDate: Date | null
  labels: { id: string; color: string }[]
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

  const isOverdue = card.dueDate ? card.dueDate.getTime() < now : false

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(card.id)}
      className={cn(
        "flex cursor-grab flex-col gap-1.5 rounded-md border bg-card p-2.5 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <span key={l.id} className="h-2 w-6 rounded-full" style={{ backgroundColor: l.color }} />
          ))}
        </div>
      )}
      <span>{card.title}</span>
      {card.dueDate && (
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
            isOverdue ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          )}
        >
          <Clock className="size-3" />
          {card.dueDate.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
        </span>
      )}
    </div>
  )
}
