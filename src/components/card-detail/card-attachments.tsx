"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Paperclip, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AttachmentT } from "./types"

function formatSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CardAttachments({
  cardId,
  attachments,
  onChange,
}: {
  cardId: string
  attachments: AttachmentT[]
  onChange: (attachments: AttachmentT[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.set("cardId", cardId)
      formData.set("file", file)
      const res = await fetch("/api/attachments", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Errore nel caricamento del file")
      const attachment = (await res.json()) as AttachmentT
      onChange([...attachments, { ...attachment, createdAt: new Date(attachment.createdAt) }])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDelete(attachmentId: string) {
    const prev = attachments
    onChange(attachments.filter((a) => a.id !== attachmentId))
    try {
      const res = await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Errore nell'eliminazione")
    } catch (err) {
      onChange(prev)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        {attachments.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{a.fileName}</span>
            <span className="text-xs text-muted-foreground">{formatSize(a.sizeBytes)}</span>
            <a href={`/api/attachments/${a.id}`} download className="text-muted-foreground hover:text-foreground">
              <Download className="size-3.5" />
            </a>
            <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <Button
        size="sm"
        variant="outline"
        className="w-fit"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="size-3.5" />
        {isUploading ? "Caricamento..." : "Allega file"}
      </Button>
    </div>
  )
}
