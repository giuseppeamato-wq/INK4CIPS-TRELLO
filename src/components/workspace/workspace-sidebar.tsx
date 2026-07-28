"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Settings, Plus, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"

type WorkspaceSummary = { id: string; name: string; slug: string; role: string }

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
      <div className="flex flex-col gap-1">
        <span className="px-2 text-xs font-medium text-muted-foreground">
          Workspace
        </span>
        {workspaces.map((w) => (
          <Link
            key={w.id}
            href={`/w/${w.slug}`}
            className={cn(
              "truncate rounded-md px-2 py-1.5 text-sm hover:bg-muted",
              w.slug === currentSlug && "bg-muted font-medium"
            )}
          >
            {w.name}
          </Link>
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
