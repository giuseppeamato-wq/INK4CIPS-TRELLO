"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { renameBoardAction, deleteBoardAction } from "@/lib/actions/boards"
import { getBoardBackground } from "@/lib/board-backgrounds"
import { cn } from "@/lib/utils"

export function BoardCard({
  board,
  workspaceSlug,
  workspaceName,
  canEdit,
}: {
  board: { id: string; name: string; background: string | null }
  workspaceSlug: string
  workspaceName: string
  canEdit: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(board.name)
  const [renaming, setRenaming] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function saveRename() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === board.name) {
      setRenaming(false)
      return
    }
    setIsSubmitting(true)
    try {
      await renameBoardAction(board.id, trimmed)
      setRenaming(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Eliminare la board "${board.name}"? L'operazione non è reversibile.`)) return
    setDeleted(true)
    try {
      await deleteBoardAction(board.id)
      router.refresh()
    } catch (err) {
      setDeleted(false)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  if (deleted) return null

  return (
    <>
      {/* Full-tile gradient at every breakpoint, matching the design system's
          board grid (rename/delete/color also live in the board's own
          "modifica progetto" dialog, this menu is just a shortcut). */}
      <div className="relative">
        <Link
          href={`/w/${workspaceSlug}/b/${board.id}`}
          className={cn(
            "flex h-[110px] flex-col justify-between overflow-hidden rounded-2xl p-3 md:h-[130px] md:p-4",
            getBoardBackground(board.background).className
          )}
        >
          <span className="font-heading text-sm leading-tight font-bold text-white [text-shadow:0_1px_4px_rgb(0_0_0_/_0.2)]">
            {board.name}
          </span>
          <span className="text-xs font-medium text-white/85">{workspaceName}</span>
        </Link>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2 right-2 text-white hover:bg-white/20 hover:text-white"
                  onClick={(e) => e.preventDefault()}
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenaming(true)}>Rinomina</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rinomina board</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={saveRename} disabled={isSubmitting}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
