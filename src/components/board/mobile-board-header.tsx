"use client"

import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBoardBackground } from "@/lib/board-backgrounds"
import { EditBoardSheet } from "./edit-board-sheet"

type Member = { userId: string; role: string; name: string | null; email: string }

export function MobileBoardHeader({
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
    <div className={cn("relative p-4 pb-5 md:hidden", getBoardBackground(board.background).className)}>
      <div className="flex items-center justify-between">
        <Link
          href={`/w/${workspaceSlug}`}
          aria-label="Torna al workspace"
          className="flex size-[34px] items-center justify-center rounded-[9px] bg-white/20"
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
                className="flex size-[34px] items-center justify-center rounded-[9px] bg-white/20"
              >
                <MoreHorizontal className="size-4 text-white" />
              </button>
            }
          />
        )}
      </div>
      <div className="mt-3.5 font-heading text-xl font-extrabold text-white [text-shadow:0_1px_6px_rgb(0_0_0_/_0.2)]">
        {board.name}
      </div>
      <div className="mt-0.5 text-xs text-white/85">{workspaceName}</div>
    </div>
  )
}
