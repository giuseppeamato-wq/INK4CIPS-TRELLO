"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateWorkspaceDriveUrlAction } from "@/lib/actions/workspaces"

export function WorkspaceDriveUrlField({
  workspaceId,
  driveUrl,
}: {
  workspaceId: string
  driveUrl: string | null
}) {
  const router = useRouter()
  const [value, setValue] = useState(driveUrl ?? "")
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    setIsSaving(true)
    try {
      await updateWorkspaceDriveUrlAction(workspaceId, value.trim())
      toast.success("Link Google Drive salvato")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        className="max-w-md"
      />
      <Button size="sm" onClick={save} disabled={isSaving}>
        Salva
      </Button>
    </div>
  )
}
