"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Settings, Plus, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  const [mobileOpen, setMobileOpen] = useState(false)

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
      {/* Mobile: floating toggle + slide-over drawer */}
      <Button
        variant="outline"
        size="icon-sm"
        className="fixed top-[68px] left-3 z-40 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Apri menu"
      >
        <Menu className="size-4" />
      </Button>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Chiudi menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-64 flex-col gap-4 overflow-y-auto bg-background p-4 shadow-lg"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setMobileOpen(false)
            }}
          >
            <div className="flex justify-end">
              <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)} aria-label="Chiudi menu">
                <X className="size-4" />
              </Button>
            </div>
            {content}
          </aside>
        </div>
      )}

      {/* Desktop: static sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r p-4 md:flex">{content}</aside>
    </>
  )
}
