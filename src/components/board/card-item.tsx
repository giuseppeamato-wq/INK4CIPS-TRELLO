"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CheckSquare, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { LIST_KIND_INFO, type ListKind } from "@/lib/list-kinds"

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
  labels: { id: string; color: string; name?: string }[]
  checklist?: { done: number; total: number } | null
  assignees?: { userId: string; name: string }[]
}

export function CardItem({
  card,
  kind,
  onOpen,
}: {
  card: CardT
  kind?: ListKind | null
  onOpen?: (cardId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.listId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = card.dueDate ? card.dueDate.getTime() < now : false
  const hasLabels = card.labels.length > 0
  const hasChecklist = !!card.checklist && card.checklist.total > 0
  const hasAssignees = !!card.assignees && card.assignees.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(card.id)}
      className={cn(
        "flex cursor-grab overflow-hidden rounded-[12px] border border-border bg-card text-sm shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      {kind && <div className={cn("w-[5px] shrink-0", LIST_KIND_INFO[kind].barClassName)} />}
      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        <span className="text-[13.5px] leading-[1.3] font-semibold text-foreground">{card.title}</span>
        {hasLabels && (
          <div className="flex flex-wrap gap-1.5">
            {card.labels.map((l) => (
              <span
                key={l.id}
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name || "   "}
              </span>
            ))}
          </div>
        )}
        {(hasChecklist || card.dueDate) && (
          <div className="flex flex-wrap items-center gap-2.5">
            {hasChecklist && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <CheckSquare className="size-3" />
                {card.checklist!.done}/{card.checklist!.total}
              </span>
            )}
            {card.dueDate && (
              <span
                className={cn(
                  "flex w-fit items-center gap-1 text-[11px] font-medium",
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                )}
              >
                <Clock className="size-3" />
                {card.dueDate.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}
      </div>
      {hasAssignees && (
        <div className="flex shrink-0 items-center px-3">
          {card.assignees!.slice(0, 3).map((person, i) => (
            <div
              key={person.userId}
              style={{ marginLeft: i === 0 ? 0 : -8 }}
              className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-secondary font-heading text-[10px] font-bold"
            >
              {person.name.slice(0, 1).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
