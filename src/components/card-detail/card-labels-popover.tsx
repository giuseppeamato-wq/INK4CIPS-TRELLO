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

const PALETTE = ["#61bd4f", "#f2d600", "#ff9f1a", "#eb5a46", "#c377e0", "#0079bf", "#00c2e0", "#51e898"]

// Relative-luminance check so label text stays readable against any swatch
// (e.g. the yellow/lime picks in this palette need dark text, not white).
function textColorFor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.6 ? "#111111" : "#ffffff"
}

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
        <Badge
          key={l.id}
          className="h-auto rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
          style={{ backgroundColor: l.color, color: textColorFor(l.color) }}
        >
          {l.name || " "}
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label="Aggiungi etichetta"
              className="flex size-7 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#c2c2c2] text-ink-faint"
            >
              <Plus className="size-3.5" />
            </button>
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
                  <span className="px-2 text-xs" style={{ color: textColorFor(l.color) }}>
                    {l.name}
                  </span>
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
