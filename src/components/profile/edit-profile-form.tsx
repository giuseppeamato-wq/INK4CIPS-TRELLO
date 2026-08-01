"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
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
  const [isSaving, setIsSaving] = useState(false)

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
      <div className="mb-7 flex flex-col items-center gap-2.5 py-2.5">
        <Avatar size="lg" className="size-[84px]">
          {image && <AvatarImage src={image} alt={initialName} />}
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">Nome completo</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">Email</label>
          <Input value={email} disabled />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">Ruolo</label>
          <Input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Es. Product Designer"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      <div className="mt-7 mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        Sicurezza
      </div>
      <ChangePasswordSheet />

      <div className="mt-7 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={() => router.back()}>
          Annulla
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
          Salva
        </Button>
      </div>
    </div>
  )
}
