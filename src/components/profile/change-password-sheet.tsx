"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ChevronRight } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet"

export function ChangePasswordSheet() {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setCurrentPassword("")
      setNewPassword("")
    }
  }

  async function handleSave() {
    if (!currentPassword || newPassword.length < 8) {
      toast.error("La nuova password deve avere almeno 8 caratteri")
      return
    }
    setIsSaving(true)
    try {
      const { error } = await authClient.changePassword({ currentPassword, newPassword })
      if (error) {
        toast.error(error.message ?? "Errore imprevisto")
        return
      }
      toast.success("Password aggiornata")
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border p-3.5 text-left text-[13.5px] font-medium"
          >
            Cambia password
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </button>
        }
      />
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Cambia password</BottomSheetTitle>
        </BottomSheetHeader>

        <div className="mb-5 flex flex-col gap-2">
          <label className="text-xs font-medium">Password attuale</label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mb-7 flex flex-col gap-2">
          <label className="text-xs font-medium">Nuova password</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>

        <div className="flex gap-2.5 pb-4">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            Salva
          </Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}
