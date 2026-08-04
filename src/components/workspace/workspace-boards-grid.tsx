"use client"

import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import { BoardCard } from "./board-card"
import { CreateBoardDialog } from "./create-board-dialog"

type BoardT = { id: string; name: string; background: string | null }

export function WorkspaceBoardsGrid({
  boards,
  workspaceId,
  workspaceSlug,
  workspaceName,
  canEdit,
}: {
  boards: BoardT[]
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  canEdit: boolean
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return boards
    return boards.filter((b) => b.name.toLowerCase().includes(q))
  }, [boards, query])

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-0 md:overflow-y-auto">
      {/* Desktop header: title + search + "Nuovo board" share one row,
          matching the design exactly (mobile keeps its own stacked title
          and floating action buttons, rendered by the page). */}
      <div className="hidden items-center justify-between md:flex md:px-9 md:pt-7 md:pb-4">
        <div>
          <div className="text-xs font-medium text-ink-faint">Workspace</div>
          <div className="font-heading text-2xl font-extrabold text-foreground">{workspaceName}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-[240px] items-center gap-2 rounded-[10px] bg-ink-soft px-3.5">
            <Search className="size-[15px] shrink-0 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca board"
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-ink-faint"
            />
          </div>
          <CreateBoardDialog
            workspaceId={workspaceId}
            trigger={
              <button
                type="button"
                className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#1a1a1a] px-[18px] text-[13px] font-semibold text-white"
              >
                <Plus className="size-[15px]" strokeWidth={2.2} />
                Nuovo board
              </button>
            }
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground md:px-9">
          {boards.length === 0
            ? "Nessuna board ancora. Creane una per iniziare a organizzare il lavoro."
            : "Nessuna board corrisponde alla ricerca."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-20 sm:grid-cols-3 md:gap-[18px] md:px-9 md:pb-10 lg:grid-cols-4">
          {filtered.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              workspaceSlug={workspaceSlug}
              workspaceName={workspaceName}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
