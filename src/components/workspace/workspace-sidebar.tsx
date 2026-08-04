"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, MoreHorizontal, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { colorForWorkspace } from "@/lib/workspace-colors"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { EditWorkspaceSheet } from "@/components/workspace/edit-workspace-sheet"

type WorkspaceSummary = {
  id: string
  name: string
  slug: string
  role: string
  driveUrl: string | null
  coverPath?: string | null
}

export function WorkspaceSidebar({
  workspaces,
  currentSlug = "",
  currentUser,
  hideMobileBar = false,
}: {
  workspaces: WorkspaceSummary[]
  currentSlug?: string
  currentUser?: { name: string; email: string; image: string | null }
  // Pages outside the workspace shell (profile and its subpages) already
  // get a mobile top bar from AppHeader — the workspace-switcher bar below
  // would just duplicate it, so callers there opt out of it.
  hideMobileBar?: boolean
}) {
  const pathname = usePathname()
  // A board's own gradient header already provides back-navigation and
  // context, so the plain workspace bar would just duplicate it on mobile.
  const isBoardDetail = /\/b\/[^/]+$/.test(pathname)
  const current = workspaces.find((w) => w.slug === currentSlug)

  const content = (
    <>
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-1">
        <span className="font-heading text-[15px] font-extrabold text-foreground">INK4CIPS</span>
      </div>

      <div className="flex flex-col px-0.5">
        <span className="px-2.5 py-1.5 text-[11px] font-bold tracking-[0.05em] text-ink-faint uppercase">
          Workspace
        </span>
        {workspaces.map((w) => (
          <div
            key={w.id}
            className={cn(
              "flex items-center gap-2.5 rounded-[9px] py-2 pr-2 pl-2.5",
              w.slug === currentSlug && "bg-[#f2f2f2]"
            )}
          >
            <Link
              href={`/w/${w.slug}`}
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              {w.coverPath ? (
                <span
                  className="size-[26px] shrink-0 rounded-[7px] bg-cover bg-center"
                  style={{ backgroundImage: `url('/api/workspaces/${w.id}/cover')` }}
                />
              ) : (
                <span
                  className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] font-heading text-[11px] font-bold text-white"
                  style={{ backgroundColor: colorForWorkspace(w.id) }}
                >
                  {w.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate text-[13px] font-semibold text-foreground">{w.name}</span>
            </Link>
            {(w.role === "owner" || w.role === "admin") && (
              <EditWorkspaceSheet
                workspace={w}
                trigger={
                  <button
                    type="button"
                    aria-label={`Modifica ${w.name}`}
                    className="flex size-[22px] shrink-0 items-center justify-center rounded-md text-ink-faint hover:bg-[#ececec]"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                }
              />
            )}
          </div>
        ))}
        <CreateWorkspaceDialog
          trigger={
            <button className="mt-0.5 flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left">
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#f0f0f0]">
                <Plus className="size-[13px] text-muted-foreground" strokeWidth={2.2} />
              </span>
              <span className="text-[12.5px] font-semibold text-muted-foreground">Nuovo workspace</span>
            </button>
          }
        />
      </div>

      <div className="flex-1" />

      {currentUser && (
        <Link
          href="/profile"
          className="mx-3.5 mb-3.5 flex items-center gap-2.5 rounded-xl bg-ink-soft p-2.5"
        >
          <span
            className="size-8 shrink-0 rounded-full bg-cover bg-center"
            style={
              currentUser.image
                ? { backgroundImage: `url('${currentUser.image}')` }
                : { backgroundColor: "#1a1a1a" }
            }
          >
            {!currentUser.image && (
              <span className="flex size-full items-center justify-center font-heading text-xs font-bold text-white">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path
              d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1h.1a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
              stroke="#5a5a5a"
              strokeWidth="1.4"
            />
            <circle cx="12" cy="12" r="3" stroke="#5a5a5a" strokeWidth="1.6" />
          </svg>
          <span className="flex-1 text-[12.5px] font-semibold text-foreground">Impostazioni</span>
        </Link>
      )}
    </>
  )

  return (
    <>
      {/* Mobile: static bar linking to the full-screen workspace switcher */}
      {!isBoardDetail && !hideMobileBar && (
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

      {/* Desktop: static sidebar, matching the design system exactly */}
      <aside className="hidden w-[264px] shrink-0 flex-col border-r border-border bg-sidebar pt-3 md:flex">
        {content}
      </aside>
    </>
  )
}
