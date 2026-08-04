"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  createChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from "@/lib/actions/card-detail"
import { keyBetween } from "@/lib/ordering/position"
import type { CardStatusSync } from "@/lib/checklist-status"
import type { ChecklistT } from "./types"

export function CardChecklist({
  checklist,
  onChange,
  onCardStatusSynced,
}: {
  checklist: ChecklistT
  onChange: (checklist: ChecklistT) => void
  // The checklist is the source of truth for the card's column once it has
  // items (see syncCardStatusFromChecklist) — every mutation below can move
  // the card, so each one reports the outcome up to the board so it can
  // update the card's position immediately, without waiting on the
  // board-level realtime broadcast (which only reaches *other* open views).
  onCardStatusSynced?: (cardStatus: CardStatusSync) => void
}) {
  const [newItemText, setNewItemText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const done = checklist.items.filter((i) => i.isComplete).length
  const total = checklist.items.length

  async function toggle(itemId: string, isComplete: boolean) {
    onChange({
      ...checklist,
      items: checklist.items.map((i) => (i.id === itemId ? { ...i, isComplete } : i)),
    })
    try {
      const { cardStatus } = await toggleChecklistItemAction(itemId, isComplete)
      onCardStatusSynced?.(cardStatus)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function remove(itemId: string) {
    const prev = checklist.items
    onChange({ ...checklist, items: checklist.items.filter((i) => i.id !== itemId) })
    try {
      const { cardStatus } = await deleteChecklistItemAction(itemId)
      onCardStatusSynced?.(cardStatus)
    } catch (err) {
      onChange({ ...checklist, items: prev })
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function addItem() {
    const trimmed = newItemText.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    try {
      const lastKey = checklist.items.length ? checklist.items[checklist.items.length - 1].sortKey : null
      const sortKey = keyBetween(lastKey, null)
      const { cardStatus, ...item } = await createChecklistItemAction(checklist.id, trimmed, sortKey)
      onChange({ ...checklist, items: [...checklist.items, item] })
      onCardStatusSynced?.(cardStatus)
      setNewItemText("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{checklist.title}</span>
        {total > 0 && <span className="text-xs text-ink-faint">{done}/{total}</span>}
      </div>
      {total > 0 && (
        <div className="h-1.5 overflow-hidden rounded-[4px] bg-[#eeeeee]">
          <div
            className="h-full rounded-[4px] bg-[#22c55e] transition-[width]"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {checklist.items.map((item) => (
          <div key={item.id} className="group flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggle(item.id, !item.isComplete)}
              className={cn(
                "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.6px]",
                item.isComplete ? "border-[#22c55e] bg-[#22c55e]" : "border-[#d4d4d4] bg-transparent"
              )}
            >
              {item.isComplete && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className={cn("flex-1 text-[13px]", item.isComplete ? "text-ink-faint line-through" : "text-foreground")}>
              {item.text}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="text-ink-faint opacity-0 group-hover:opacity-100 hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Aggiungi elemento..."
          className="h-8 rounded-lg border-[#e5e5e5] bg-[#fafafa] text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") addItem()
          }}
        />
        <Button size="sm" variant="outline" onClick={addItem} disabled={isSubmitting}>
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
