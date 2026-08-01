"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { renameWorkspaceAction, deleteWorkspaceAction } from "@/lib/actions/workspaces"
import { colorForWorkspace } from "@/lib/workspace-colors"
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
  workspace: { id: string; name: string; coverPath?: string | null }
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(workspace.name)
  const [coverPath, setCoverPath] = useState(workspace.coverPath ?? null)
  const [coverVersion, setCoverVersion] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName(workspace.name)
      setCoverPath(workspace.coverPath ?? null)
      setConfirmingDelete(false)
    }
  }

  async function handleCoverSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setIsUploadingCover(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const res = await fetch(`/api/workspaces/${workspace.id}/cover`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Errore nel caricamento della copertina")
      const { coverPath: newPath } = (await res.json()) as { coverPath: string }
      setCoverPath(newPath)
      setCoverVersion((v) => v + 1)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsUploadingCover(false)
    }
  }

  async function handleRemoveCover() {
    setIsUploadingCover(true)
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/cover`, { method: "DELETE" })
      if (!res.ok) throw new Error("Errore nella rimozione della copertina")
      setCoverPath(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsUploadingCover(false)
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

        <div className="mb-5 flex flex-col items-center gap-2.5">
          {coverPath ? (
            <div
              className="size-[72px] rounded-2xl bg-cover bg-center"
              style={{
                backgroundImage: `url('/api/workspaces/${workspace.id}/cover?v=${coverVersion}')`,
              }}
            />
          ) : (
            <div
              className="flex size-[72px] items-center justify-center rounded-2xl font-heading text-2xl font-bold text-white"
              style={{ backgroundColor: colorForWorkspace(workspace.id) }}
            >
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCover}
            className="text-xs font-semibold text-muted-foreground"
          >
            Cambia copertina
          </button>
          {coverPath && (
            <button
              type="button"
              onClick={handleRemoveCover}
              disabled={isUploadingCover}
              className="text-xs font-semibold text-destructive"
            >
              Rimuovi copertina
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverSelected}
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-2 pb-5">
          <label className="text-xs font-medium">Nome workspace</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
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
