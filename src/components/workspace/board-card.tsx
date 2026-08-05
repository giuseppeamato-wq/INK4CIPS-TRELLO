import Link from "next/link"
import { getBoardBackground } from "@/lib/board-backgrounds"
import { cn } from "@/lib/utils"

export function BoardCard({
  board,
  workspaceSlug,
  workspaceName,
}: {
  board: { id: string; name: string; background: string | null }
  workspaceSlug: string
  workspaceName: string
}) {
  return (
    <Link
      href={`/w/${workspaceSlug}/b/${board.id}`}
      className={cn(
        "flex h-[110px] flex-col justify-between overflow-hidden rounded-[14px] p-3 md:h-[130px] md:p-4",
        getBoardBackground(board.background).className
      )}
    >
      <span className="font-heading text-[15px] leading-tight font-bold text-white [text-shadow:0_1px_4px_rgb(0_0_0_/_0.2)]">
        {board.name}
      </span>
      <span className="text-[11.5px] font-medium text-white/85">{workspaceName}</span>
    </Link>
  )
}
