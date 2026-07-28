"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createListAction } from "@/lib/actions/lists"
import { keyBetween } from "@/lib/ordering/position"
import type { ListT } from "./list-column"

export function CreateListForm({
  boardId,
  lastSortKey,
  onCreated,
}: {
  boardId: string
  lastSortKey: string | null
  onCreated: (list: ListT) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setOpen(false)
      return
    }
    setIsSubmitting(true)
    try {
      const sortKey = keyBetween(lastSortKey, null)
      const list = await createListAction(boardId, trimmed, sortKey)
      onCreated(list)
      setName("")
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
        className="flex w-72 shrink-0 items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted"
      >
        <Plus className="size-3.5" />
        Aggiungi lista
      </button>
    )
  }

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/50 p-2.5">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome lista..."
        onKeyDown={(e) => {
          if (e.key === "Enter") submit()
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
            setName("")
          }}
        >
          Annulla
        </Button>
      </div>
    </div>
  )
}
