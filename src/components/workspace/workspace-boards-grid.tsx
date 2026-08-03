"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { BoardCard } from "./board-card"

type BoardT = { id: string; name: string; background: string | null }

export function WorkspaceBoardsGrid({
  boards,
  workspaceSlug,
  workspaceName,
  canEdit,
}: {
  boards: BoardT[]
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
    <div className="flex flex-1 flex-col gap-4">
      <div className="hidden max-w-xs items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 md:flex">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca board"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {boards.length === 0
            ? "Nessuna board ancora. Creane una per iniziare a organizzare il lavoro."
            : "Nessuna board corrisponde alla ricerca."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-20 sm:grid-cols-3 md:gap-4 md:pb-0 lg:grid-cols-4">
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
