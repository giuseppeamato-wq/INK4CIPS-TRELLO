"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LayoutGrid, Settings, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"

type WorkspaceSummary = { id: string; name: string; slug: string; role: string; driveUrl: string | null }

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon points="8.5,3 15.5,3 22,14.5 15,14.5" fill="#FFC107" />
      <polygon points="2,14.5 8.5,3 15,14.5 8.5,21.5" fill="#4285F4" />
      <polygon points="8.5,21.5 15,14.5 22,14.5 15.5,21.5" fill="#34A853" />
    </svg>
  )
}

export function WorkspaceSidebar({
  workspaces,
  currentSlug,
}: {
  workspaces: WorkspaceSummary[]
  currentSlug: string
}) {
  const pathname = usePathname()
  const isSettings = pathname.endsWith("/settings")
  // A board's own gradient header already provides back-navigation and
  // context, so the plain workspace bar would just duplicate it on mobile.
  const isBoardDetail = /\/b\/[^/]+$/.test(pathname)
  const current = workspaces.find((w) => w.slug === currentSlug)

  const content = (
    <>
      <Link href="/" className="flex items-center gap-2 px-2">
        <img src="/logo.png" alt="INK4CIPS" className="size-7 rounded-md" />
        <span className="truncate font-heading text-sm font-semibold">INK4CIPS</span>
      </Link>

      <div className="flex flex-col gap-1">
        <span className="px-2 text-xs font-medium text-muted-foreground">
          Workspace
        </span>
        {workspaces.map((w) => (
          <div key={w.id} className="flex items-center gap-1">
            <Link
              href={`/w/${w.slug}`}
              className={cn(
                "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                w.slug === currentSlug && "bg-muted font-medium"
              )}
            >
              {w.name}
            </Link>
            {w.driveUrl && (
              <a
                href={w.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md p-1 hover:bg-muted"
                aria-label={`Apri Google Drive di ${w.name}`}
              >
                <GoogleDriveIcon className="size-4" />
              </a>
            )}
          </div>
        ))}
        <div className="mt-1 px-2">
          <CreateWorkspaceDialog
            trigger={
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Plus className="size-3.5" />
                Nuovo workspace
              </button>
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t pt-4">
        <Link
          href={`/w/${currentSlug}`}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
            !isSettings && "bg-muted font-medium"
          )}
        >
          <LayoutGrid className="size-4" />
          Board
        </Link>
        <Link
          href={`/w/${currentSlug}/settings`}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
            isSettings && "bg-muted font-medium"
          )}
        >
          <Settings className="size-4" />
          Impostazioni
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile: static bar linking to the full-screen workspace switcher */}
      {!isBoardDetail && (
        <Link
          href="/w"
          className="flex items-center justify-between border-b px-4 py-2.5 md:hidden"
        >
          <div>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Workspace
              <ChevronDown className="size-3" />
            </span>
            <span className="font-heading text-base font-bold">{current?.name}</span>
          </div>
        </Link>
      )}

      {/* Desktop: static sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r p-4 md:flex">{content}</aside>
    </>
  )
}
