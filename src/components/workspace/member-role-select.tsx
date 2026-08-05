"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { updateMemberRoleAction } from "@/lib/actions/workspaces"

const ROLES = [
  { value: "member", label: "Membro" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
] as const

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

  async function handleChange(next: "admin" | "editor" | "member") {
    if (next === current || isSaving) return
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
    <div className="flex shrink-0 gap-0.5 rounded-lg bg-[#f2f2f2] p-[3px]">
      {ROLES.map((r) => (
        <button
          key={r.value}
          type="button"
          disabled={isSaving}
          onClick={() => handleChange(r.value)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-[11.5px] font-bold disabled:opacity-60",
            current === r.value ? "bg-[#1a1a1a] text-white" : "text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
