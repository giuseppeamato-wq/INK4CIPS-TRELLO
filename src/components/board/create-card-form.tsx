"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createCardAction } from "@/lib/actions/cards"
import { keyBetween } from "@/lib/ordering/position"
import type { CardT } from "./card-item"

export function CreateCardForm({
  listId,
  lastSortKey,
  onCreated,
}: {
  listId: string
  lastSortKey: string | null
  onCreated: (card: CardT) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    const trimmed = title.trim()
    if (!trimmed) {
      setOpen(false)
      return
    }
    setIsSubmitting(true)
    try {
      const sortKey = keyBetween(lastSortKey, null)
      const card = await createCardAction(listId, trimmed, sortKey)
      onCreated({ ...card, dueDate: null, labels: [] })
      setTitle("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
      >
        <Plus className="size-3.5" />
        Aggiungi card
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titolo card..."
        className="min-h-16 resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
          if (e.key === "Escape") setOpen(false)
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={isSubmitting}>
          Aggiungi
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            setTitle("")
          }}
        >
          Annulla
        </Button>
      </div>
    </div>
  )
}
