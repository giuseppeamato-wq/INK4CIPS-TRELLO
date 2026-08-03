"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  createChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from "@/lib/actions/card-detail"
import { keyBetween } from "@/lib/ordering/position"
import type { ChecklistT } from "./types"

export function CardChecklist({
  checklist,
  onChange,
}: {
  checklist: ChecklistT
  onChange: (checklist: ChecklistT) => void
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
      await toggleChecklistItemAction(itemId, isComplete)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function remove(itemId: string) {
    const prev = checklist.items
    onChange({ ...checklist, items: checklist.items.filter((i) => i.id !== itemId) })
    try {
      await deleteChecklistItemAction(itemId)
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
      const item = await createChecklistItemAction(checklist.id, trimmed, sortKey)
      onChange({ ...checklist, items: [...checklist.items, item] })
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
        <span className="text-sm font-medium">{checklist.title}</span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{total}
          </span>
        )}
      </div>
      {total > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        {checklist.items.map((item) => (
          <div key={item.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted">
            <Checkbox
              checked={item.isComplete}
              onCheckedChange={(checked) => toggle(item.id, checked === true)}
            />
            <span className={item.isComplete ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"}>
              {item.text}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
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
          className="h-8 text-sm"
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
