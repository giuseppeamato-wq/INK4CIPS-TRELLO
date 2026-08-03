"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LayoutGrid, Settings, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { colorForWorkspace } from "@/lib/workspace-colors"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"

type WorkspaceSummary = {
  id: string
  name: string
  slug: string
  role: string
  driveUrl: string | null
  coverPath?: string | null
}

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
  currentUser,
}: {
  workspaces: WorkspaceSummary[]
  currentSlug: string
  currentUser?: { name: string; email: string; image: string | null }
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
                "flex min-w-0 flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                w.slug === currentSlug && "bg-muted font-medium"
              )}
            >
              {w.coverPath ? (
                <span
                  className="size-[22px] shrink-0 rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url('/api/workspaces/${w.id}/cover')` }}
                />
              ) : (
                <span
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-md font-heading text-[11px] font-bold text-white"
                  style={{ backgroundColor: colorForWorkspace(w.id) }}
                >
                  {w.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate">{w.name}</span>
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

      {currentUser && (
        <Link
          href="/profile"
          className="mt-auto flex items-center gap-2.5 rounded-xl bg-muted/60 p-2.5 hover:bg-muted"
        >
          {currentUser.image ? (
            <img src={currentUser.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <User className="size-4" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{currentUser.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{currentUser.email}</div>
          </div>
        </Link>
      )}
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
      <aside className="hidden w-[264px] shrink-0 flex-col gap-4 border-r bg-muted/20 p-4 md:flex">{content}</aside>
    </>
  )
}
