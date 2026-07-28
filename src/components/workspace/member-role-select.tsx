"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateMemberRoleAction } from "@/lib/actions/workspaces"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  member: "Membro",
}

export function MemberRoleSelect({
  workspaceId,
  userId,
  role,
}: {
  workspaceId: string
  userId: string
  role: "admin" | "editor" | "member"
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(role)
  const [isSaving, setIsSaving] = useState(false)

  async function handleChange(value: string | null) {
    if (!value) return
    const next = value as "admin" | "editor" | "member"
    const prev = current
    setCurrent(next)
    setIsSaving(true)
    try {
      await updateMemberRoleAction(workspaceId, userId, next)
      router.refresh()
    } catch (err) {
      setCurrent(prev)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Select value={current} onValueChange={handleChange} disabled={isSaving}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue>{(value: string) => ROLE_LABELS[value] ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="member">Membro</SelectItem>
        <SelectItem value="editor">Editor</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  )
}
