"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover"
import { createLabelAction, toggleCardLabelAction } from "@/lib/actions/card-detail"
import type { CardLabelT } from "./types"

const PALETTE = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#6366f1", "#a855f7", "#64748b"]

export function CardLabelsPopover({
  cardId,
  boardId,
  labels,
  boardLabels,
  onChange,
  onBoardLabelsChange,
}: {
  cardId: string
  boardId: string
  labels: CardLabelT[]
  boardLabels: CardLabelT[]
  onChange: (labels: CardLabelT[]) => void
  onBoardLabelsChange: (labels: CardLabelT[]) => void
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(PALETTE[0])
  const [isCreating, setIsCreating] = useState(false)

  async function toggle(label: CardLabelT) {
    const isAttached = labels.some((l) => l.id === label.id)
    onChange(isAttached ? labels.filter((l) => l.id !== label.id) : [...labels, label])
    try {
      await toggleCardLabelAction(cardId, label.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function createLabel() {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsCreating(true)
    try {
      const label = await createLabelAction(boardId, trimmed, color)
      onBoardLabelsChange([...boardLabels, label])
      // Creating a label from within a card also attaches it to that card
      // (matches the optimistic UI, which already shows it as attached).
      await toggleCardLabelAction(cardId, label.id)
      onChange([...labels, label])
      setName("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labels.map((l) => (
        <Badge key={l.id} style={{ backgroundColor: l.color, color: "white" }}>
          {l.name || " "}
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon-sm" className="rounded-full">
              <Plus className="size-3.5" />
            </Button>
          }
        />
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Etichette</PopoverTitle>
          </PopoverHeader>
          <div className="flex flex-col gap-1">
            {boardLabels.map((l) => (
              <button
                key={l.id}
                onClick={() => toggle(l)}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-muted"
              >
                <span
                  className="h-5 flex-1 rounded"
                  style={{ backgroundColor: l.color }}
                >
                  <span className="px-2 text-xs text-white">{l.name}</span>
                </span>
                {labels.some((cl) => cl.id === l.id) && <span className="text-xs">✓</span>}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t pt-2">
            <div className="flex gap-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="size-5 rounded-full ring-offset-1"
                  style={{ backgroundColor: c, outline: c === color ? "2px solid black" : "none" }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nuova etichetta..."
                className="h-7 text-xs"
              />
              <Button size="sm" onClick={createLabel} disabled={isCreating}>
                Crea
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
