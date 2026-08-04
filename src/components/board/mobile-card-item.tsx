"use client"

import { CheckSquare, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { LIST_KIND_INFO, type ListKind } from "@/lib/list-kinds"
import type { CardT } from "./card-item"

export function MobileCardItem({
  card,
  kind,
  onOpen,
}: {
  card: CardT
  kind?: ListKind | null
  onOpen: (cardId: string) => void
}) {
  const hasChecklist = !!card.checklist && card.checklist.total > 0
  const hasAssignees = !!card.assignees && card.assignees.length > 0

  return (
    <div
      onClick={() => onOpen(card.id)}
      className="flex cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      {kind && <div className={cn("w-[5px] shrink-0", LIST_KIND_INFO[kind].barClassName)} />}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="text-sm font-medium">{card.title}</div>

        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.labels.map((label) => (
              <span
                key={label.id}
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name || "   "}
              </span>
            ))}
          </div>
        )}

        {(hasChecklist || card.dueDate) && (
          <div className="flex gap-2.5">
            {hasChecklist && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <CheckSquare className="size-3" />
                {card.checklist!.done}/{card.checklist!.total}
              </span>
            )}
            {card.dueDate && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock className="size-3" />
                {card.dueDate.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}
      </div>

      {hasAssignees && (
        <div className="flex shrink-0 items-center pr-3">
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
