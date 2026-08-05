"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        className="h-11 w-full min-w-0 rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-3.5 text-[13.5px] outline-none"
      />
      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        className="h-11 shrink-0 rounded-[10px] bg-[#1a1a1a] px-4 text-[13.5px] font-semibold text-white disabled:opacity-50"
      >
        {isSaving ? "Salvataggio..." : "Salva"}
      </button>
    </div>
  )
}
