"use client"

import { useState } from "react"
import { Check, Link as LinkIcon } from "lucide-react"

export function CopyInviteLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copia link invito"
      title="Copia link invito"
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-soft text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="size-3.5" /> : <LinkIcon className="size-3.5" />}
    </button>
  )
}
