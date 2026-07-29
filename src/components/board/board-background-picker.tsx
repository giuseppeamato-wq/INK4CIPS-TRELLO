"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger, PopoverHeader, PopoverTitle } from "@/components/ui/popover"
import { BOARD_BACKGROUNDS } from "@/lib/board-backgrounds"
import { cn } from "@/lib/utils"
import { updateBoardBackgroundAction } from "@/lib/actions/boards"

export function BoardBackgroundPicker({
  boardId,
  current,
}: {
  boardId: string
  current: string | null
}) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  async function pick(id: string) {
    setIsSaving(true)
    try {
      await updateBoardBackgroundAction(boardId, id)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Cambia sfondo">
            <Palette className="size-3.5" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto">
        <PopoverHeader>
          <PopoverTitle>Sfondo board</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-wrap gap-2">
          {BOARD_BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              aria-label={bg.label}
              disabled={isSaving}
              onClick={() => pick(bg.id)}
              className={cn(
                "size-8 rounded-full ring-2 ring-offset-2 ring-offset-popover transition-shadow disabled:opacity-50",
                bg.className,
                current === bg.id ? "ring-foreground" : "ring-transparent"
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
