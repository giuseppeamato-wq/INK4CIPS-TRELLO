"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { renameWorkspaceAction, deleteWorkspaceAction } from "@/lib/actions/workspaces"
import { colorForWorkspace } from "@/lib/workspace-colors"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function EditWorkspaceSheet({
  workspace,
  trigger,
}: {
  workspace: { id: string; name: string; coverPath?: string | null; slug?: string; role?: string }
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

  const isMobile = useIsMobile()

  const canManageMembers = workspace.role === "owner" || workspace.role === "admin"

  const body = (
    <>
        <div className="mb-[22px] flex flex-col items-center gap-2.5">
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
            className="text-xs font-semibold text-ink-faint"
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

        <div className="mb-5 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nome workspace</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 text-sm"
          />
        </div>

        {canManageMembers && workspace.slug && (
          <Link
            href={`/w/${workspace.slug}/settings`}
            className="mb-5 -mt-2.5 block text-xs font-semibold text-ink-faint"
          >
            Gestisci membri e inviti →
          </Link>
        )}

        <div className="mb-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-[10px] bg-[#f2f2f2] py-3 text-center text-sm font-semibold text-foreground"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-[10px] bg-[#1a1a1a] py-3 text-center text-sm font-semibold text-white disabled:opacity-50"
          >
            Salva
          </button>
        </div>

        {confirmingDelete ? (
          <div className="rounded-xl border border-[#f3d4d4] bg-[#fef2f2] p-3.5">
            <p className="mb-2.5 text-[13px] font-semibold text-[#991b1b]">
              Eliminare questo workspace e i suoi board? L&apos;azione non è reversibile.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-[10px] border border-[#f3d4d4] bg-white py-2.5 text-center text-[13px] font-semibold text-foreground"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-[10px] bg-destructive py-2.5 text-center text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Elimina
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="w-full rounded-[10px] border border-[#f3d4d4] py-3 text-center text-[13.5px] font-semibold text-destructive"
          >
            Elimina workspace
          </button>
        )}
    </>
  )

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetTrigger render={trigger} />
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Modifica workspace</BottomSheetTitle>
          </BottomSheetHeader>
          {body}
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} className="w-full max-w-[420px] rounded-2xl p-6 sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="mb-1 font-heading text-base font-bold text-foreground">
            Modifica workspace
          </DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
