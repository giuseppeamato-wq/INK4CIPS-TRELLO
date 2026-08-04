"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check } from "lucide-react"

import { renameBoardAction, updateBoardBackgroundAction, deleteBoardAction } from "@/lib/actions/boards"
import { updateMemberRoleAction } from "@/lib/actions/workspaces"
import { BOARD_BACKGROUNDS } from "@/lib/board-backgrounds"
import { cn } from "@/lib/utils"
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

type Member = { userId: string; role: string; name: string | null; email: string }

export function EditBoardSheet({
  board,
  workspaceId,
  members,
  canManageRoles,
  trigger,
}: {
  board: { id: string; name: string; background: string | null }
  workspaceId: string
  members: Member[]
  canManageRoles: boolean
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(board.name)
  const [background, setBackground] = useState(board.background ?? BOARD_BACKGROUNDS[0].id)
  const [roles, setRoles] = useState(() => new Map(members.map((m) => [m.userId, m.role])))
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName(board.name)
      setBackground(board.background ?? BOARD_BACKGROUNDS[0].id)
      setConfirmingDelete(false)
    }
  }

  async function setRole(userId: string, role: "editor" | "member") {
    setRoles((prev) => new Map(prev).set(userId, role))
    try {
      await updateMemberRoleAction(workspaceId, userId, role)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
      router.refresh()
    }
  }

  async function handleSave() {
    const trimmed = name.trim()
    setIsSaving(true)
    try {
      if (trimmed && trimmed !== board.name) await renameBoardAction(board.id, trimmed)
      if (background !== board.background) await updateBoardBackgroundAction(board.id, background)
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
      await deleteBoardAction(board.id)
      setOpen(false)
      router.push(`/w`)
      router.refresh()
    } catch (err) {
      setIsDeleting(false)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  const isMobile = useIsMobile()

  const body = (
    <>
        <div className="mb-5 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nome progetto</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="h-11 rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 text-sm"
          />
        </div>

        <div className="mb-2.5 text-xs font-semibold text-foreground">Colore principale</div>
        <div className="mb-[22px] flex flex-wrap gap-2.5">
          {BOARD_BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              aria-label={bg.label}
              onClick={() => setBackground(bg.id)}
              className={cn(
                "relative size-[38px] rounded-[10px] border-2",
                bg.className,
                background === bg.id ? "border-foreground" : "border-transparent"
              )}
            >
              {background === bg.id && (
                <Check className="absolute inset-0 m-auto size-4 text-white" />
              )}
            </button>
          ))}
        </div>

        {canManageRoles && members.length > 0 && (
          <>
            <div className="mb-2.5 text-xs font-semibold text-foreground">Ruoli del team</div>
            <div className="mb-[22px] flex flex-col gap-2.5">
              {members.map((m) => {
                const role = roles.get(m.userId)
                if (role === "owner" || role === "admin") return null
                return (
                  <div key={m.userId} className="flex items-center gap-3 rounded-[14px] border border-border p-3">
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-xs font-bold">
                      {(m.name ?? m.email).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
                      {m.name ?? m.email}
                    </div>
                    <div className="flex shrink-0 gap-0.5 rounded-lg bg-[#f2f2f2] p-[3px]">
                      <button
                        type="button"
                        onClick={() => setRole(m.userId, "editor")}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-[11.5px] font-bold",
                          role === "editor" ? "bg-[#1a1a1a] text-white" : "text-foreground"
                        )}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole(m.userId, "member")}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-[11.5px] font-bold",
                          role === "member" ? "bg-[#1a1a1a] text-white" : "text-foreground"
                        )}
                      >
                        Membro
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
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
              Eliminare questo progetto? L&apos;azione non è reversibile.
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
            Elimina progetto
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
            <BottomSheetTitle>Modifica progetto</BottomSheetTitle>
          </BottomSheetHeader>
          {body}
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} className="max-h-[85vh] w-full max-w-[460px] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="mb-1 font-heading text-base font-bold text-foreground">
            Modifica progetto
          </DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
