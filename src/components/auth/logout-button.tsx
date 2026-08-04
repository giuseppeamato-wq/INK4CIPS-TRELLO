"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/client"

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        compact
          ? "inline-block w-fit rounded-lg border border-[#f3d4d4] px-3 py-1.5 text-xs font-semibold text-destructive"
          : "inline-block w-fit rounded-xl border border-[#f3d4d4] px-5 py-3 text-[13.5px] font-semibold text-destructive"
      }
    >
      Esci
    </button>
  )
}
