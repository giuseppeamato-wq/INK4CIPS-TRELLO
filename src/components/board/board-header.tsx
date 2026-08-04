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
  const backButton = (
    <Link
      href={`/w/${workspaceSlug}`}
      aria-label="Torna al workspace"
      className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-white/[0.22] md:size-9"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M15 5L8 12L15 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )

  const editButton = canEdit && (
    <EditBoardSheet
      board={board}
      workspaceId={workspaceId}
      members={members}
      canManageRoles={canManageRoles}
      trigger={
        <button
          type="button"
          aria-label="Modifica progetto"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-white/[0.22] md:size-9"
        >
          <MoreHorizontal className="size-4 text-white" />
        </button>
      }
    />
  )

  return (
    <div
      className={cn(
        "relative px-[18px] pt-[18px] pb-[22px] md:flex md:items-center md:justify-between md:gap-3 md:px-9 md:pt-6 md:pb-5",
        getBoardBackground(board.background).className
      )}
    >
      {/* Mobile: icon row, then title below it (matches the design's BOARD
          SCREEN, which stacks these instead of placing them inline). */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          {backButton}
          <div className="flex gap-2">{editButton}</div>
        </div>
        <div className="mt-3.5 min-w-0">
          <div className="truncate font-heading text-xl font-extrabold text-white [text-shadow:0_1px_6px_rgb(0_0_0_/_0.2)]">
            {board.name}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/85">{workspaceName}</div>
        </div>
      </div>

      {/* Desktop: back button + title inline, edit button on the right. */}
      <div className="hidden min-w-0 items-center gap-3.5 md:flex">
        {backButton}
        <div className="min-w-0">
          <div className="truncate font-heading text-[22px] font-extrabold text-white [text-shadow:0_1px_6px_rgb(0_0_0_/_0.2)]">
            {board.name}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/85">{workspaceName}</div>
        </div>
      </div>
      <div className="hidden md:block">{editButton}</div>
    </div>
  )
}
