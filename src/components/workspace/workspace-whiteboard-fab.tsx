"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

function WhiteboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="6" fill="#7d5cf0" />
      <circle cx="15" cy="9.5" r="5.2" fill="#22c1a3" opacity="0.9" />
      <circle cx="11.5" cy="16" r="5.6" fill="#ff5c8a" opacity="0.9" />
    </svg>
  )
}

// Persistent shortcut to the workspace's shared whiteboard — hidden while
// already on the whiteboard page itself.
export function WorkspaceWhiteboardFab({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname()
  if (pathname === `/w/${workspaceSlug}/whiteboard`) return null

  return (
    <Link
      href={`/w/${workspaceSlug}/whiteboard`}
      aria-label="Apri la lavagna del workspace"
      title="Lavagna progetto"
      className="flex size-12 items-center justify-center rounded-full bg-white shadow-lg shadow-black/20"
    >
      <WhiteboardIcon className="size-[22px]" />
    </Link>
  )
}
