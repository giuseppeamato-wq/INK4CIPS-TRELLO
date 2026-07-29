import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getBoardById } from "@/lib/queries/boards"
import { getBoardContents } from "@/lib/queries/board-contents"
import { getMyRoleInWorkspace } from "@/lib/queries/workspaces"
import { BoardCanvas } from "@/components/board/board-canvas"
import { BoardBackgroundPicker } from "@/components/board/board-background-picker"

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string }>
}) {
  const { boardId } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const board = await getBoardById(boardId, session.user.id)
  if (!board) notFound()

  const [{ lists, cards }, myRole] = await Promise.all([
    getBoardContents(boardId, session.user.id),
    getMyRoleInWorkspace(board.workspaceId, session.user.id),
  ])
  const canEdit = myRole === "owner" || myRole === "admin" || myRole === "editor"

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 pt-6">
        <h1 className="font-heading text-lg font-semibold">{board.name}</h1>
        {canEdit && <BoardBackgroundPicker boardId={boardId} current={board.background} />}
      </div>
      <Suspense fallback={null}>
        <BoardCanvas
          boardId={boardId}
          initialLists={lists}
          initialCards={cards}
          canEdit={canEdit}
          background={board.background}
        />
      </Suspense>
    </div>
  )
}
