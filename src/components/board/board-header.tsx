"use client"

import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBoardBackground } from "@/lib/board-backgrounds"
import { EditBoardSheet } from "./edit-board-sheet"

type Member = { userId: string; role: string; name: string | null; email: string }

// One gradient header bar for every breakpoint, matching the design system:
// the whole board canvas below it stays plain, only this bar carries color.
export function BoardHeader({
  board,
  workspaceSlug,
  workspaceId,
  workspaceName,
  members,
  canEdit,
  canManageRoles,
}: {
  board: { id: string; name: string; background: string | null }
  workspaceSlug: string
  workspaceId: string
  workspaceName: string
  members: Member[]
  canEdit: boolean
  canManageRoles: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 p-4 pb-5 md:px-9 md:py-6",
        getBoardBackground(board.background).className
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <Link
          href={`/w/${workspaceSlug}`}
          aria-label="Torna al workspace"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-white/20 md:size-9"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 5L8 12L15 19"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="min-w-0 md:hidden">
          <div className="font-heading text-xl font-extrabold text-white [text-shadow:0_1px_6px_rgb(0_0_0_/_0.2)]">
            {board.name}
          </div>
          <div className="text-xs text-white/85">{workspaceName}</div>
        </div>
        <div className="hidden min-w-0 md:block">
          <div className="truncate font-heading text-2xl font-extrabold text-white [text-shadow:0_1px_6px_rgb(0_0_0_/_0.2)]">
            {board.name}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/85">{workspaceName}</div>
        </div>
      </div>
      {canEdit && (
        <EditBoardSheet
          board={board}
          workspaceId={workspaceId}
          members={members}
          canManageRoles={canManageRoles}
          trigger={
            <button
              type="button"
              aria-label="Modifica progetto"
              className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-white/20 md:size-9"
            >
              <MoreHorizontal className="size-4 text-white" />
            </button>
          }
        />
      )}
    </div>
  )
}
