"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { renameWorkspaceAction, deleteWorkspaceAction } from "@/lib/actions/workspaces"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet"

export function EditWorkspaceSheet({
  workspace,
  trigger,
}: {
  workspace: { id: string; name: string }
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(workspace.name)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName(workspace.name)
      setConfirmingDelete(false)
    }
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSaving(true)
    try {
      if (trimmed !== workspace.name) {
        await renameWorkspaceAction(workspace.id, trimmed)
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteWorkspaceAction(workspace.id)
      setOpen(false)
      router.push("/w")
      router.refresh()
    } catch (err) {
      setIsDeleting(false)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetTrigger render={trigger} />
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Modifica workspace</BottomSheetTitle>
        </BottomSheetHeader>

        <div className="flex flex-col gap-2 pb-5">
          <label className="text-xs font-medium">Nome workspace</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="flex gap-2.5 pb-4">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            Salva
          </Button>
        </div>

        {confirmingDelete ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
            <p className="mb-2.5 text-sm font-medium text-destructive">
              Eliminare questo workspace e i suoi board? L&apos;azione non è reversibile.
            </p>
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmingDelete(false)}
              >
                Annulla
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Elimina
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="w-full rounded-xl border border-destructive/30 py-3 text-sm font-medium text-destructive"
          >
            Elimina workspace
          </button>
        )}
      </BottomSheetContent>
    </BottomSheet>
  )
}
