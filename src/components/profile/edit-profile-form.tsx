"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function EditProfileForm({
  initialName,
  email,
  image,
}: {
  initialName: string
  email: string
  image: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSaving(true)
    try {
      await authClient.updateUser({ name: trimmed })
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

      <div className="mb-5 flex flex-col gap-2">
        <label className="text-xs font-medium">Nome</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>

      <div className="mb-7 flex flex-col gap-2">
        <label className="text-xs font-medium">Email</label>
        <Input value={email} disabled />
      </div>

      <div className="flex gap-2.5">
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
