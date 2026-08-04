"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
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
        className="rounded-xl border-[1.5px] border-dashed border-[#dcdcdc] p-3 text-center text-[12.5px] font-semibold text-ink-faint"
      >
        + Aggiungi una card
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white p-2.5">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titolo della card"
        className="mb-2 h-9 rounded-lg border-[#e5e5e5] bg-[#fafafa] px-2.5 text-[13px]"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
          if (e.key === "Escape") setOpen(false)
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-[#1a1a1a] py-1.5 text-center text-xs font-semibold text-white"
        >
          Aggiungi
        </button>
        <button
          onClick={() => {
            setOpen(false)
            setTitle("")
          }}
          className="flex-1 rounded-lg bg-[#f2f2f2] py-1.5 text-center text-xs font-semibold text-foreground"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}
