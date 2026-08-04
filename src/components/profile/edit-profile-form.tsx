"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronLeft, Pencil } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChangePasswordSheet } from "./change-password-sheet"

export function EditProfileForm({
  initialName,
  email,
  image,
  initialJobTitle,
  initialBio,
}: {
  initialName: string
  email: string
  image: string | null
  initialJobTitle: string
  initialBio: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(image)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const res = await fetch("/api/users/avatar", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Errore nel caricamento della foto")
      const { image: newImage } = (await res.json()) as { image: string }
      await authClient.updateUser({ image: newImage })
      setAvatarUrl(newImage)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function handleRemoveAvatar() {
    setIsUploadingAvatar(true)
    try {
      await fetch("/api/users/avatar", { method: "DELETE" })
      await authClient.updateUser({ image: "" })
      setAvatarUrl(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSaving(true)
    try {
      await authClient.updateUser({ name: trimmed, jobTitle: jobTitle.trim(), bio: bio.trim() })
      router.push("/profile")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSaving(false)
    }
  }

  const initials = (initialName || email).slice(0, 1).toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-5">
      <div className="mb-2 flex items-center justify-between gap-3 pb-1.5">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Annulla"
            className="flex size-9 items-center justify-center rounded-[9px] bg-ink-soft"
          >
            <ChevronLeft className="size-4 text-foreground" />
          </button>
          <span className="font-heading text-[19px] font-bold text-foreground">Modifica profilo</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-[9px] bg-[#1a1a1a] px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          Salva
        </button>
      </div>

      <div className="mb-7 flex flex-col items-center gap-2 py-2.5">
        <div className="relative">
          <Avatar size="lg" className="size-[92px]">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={initialName} />}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            aria-label="Cambia foto"
            className="absolute -right-0.5 -bottom-0.5 flex size-[30px] items-center justify-center rounded-full border-2 border-white bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
          >
            <Pencil className="size-3.5 text-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelected}
            className="hidden"
          />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="text-[12.5px] font-semibold text-muted-foreground"
        >
          Cambia foto
        </button>
        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={isUploadingAvatar}
            className="text-xs font-semibold text-destructive"
          >
            Rimuovi foto
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nome completo</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="h-11 rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Email</label>
          <Input value={email} disabled className="h-11 rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 text-sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Ruolo</label>
          <Input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Es. Product Designer"
            className="h-11 rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="resize-none rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="mt-7 mb-2 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase">
        Sicurezza
      </div>
      <ChangePasswordSheet />
    </div>
  )
}
