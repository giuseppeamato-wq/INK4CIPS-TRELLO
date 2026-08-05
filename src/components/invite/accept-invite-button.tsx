"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { acceptInviteByTokenAction } from "@/lib/actions/workspaces"
import { Button } from "@/components/ui/button"

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)

  async function handleAccept() {
    setIsJoining(true)
    try {
      const { workspaceSlug } = await acceptInviteByTokenAction(token)
      router.push(`/w/${workspaceSlug}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
      setIsJoining(false)
    }
  }

  return (
    <Button
      onClick={handleAccept}
      disabled={isJoining}
      className="h-12 w-full rounded-[10px] text-[15px] font-semibold"
    >
      {isJoining ? "Ingresso in corso..." : "Entra nel workspace"}
    </Button>
  )
}
