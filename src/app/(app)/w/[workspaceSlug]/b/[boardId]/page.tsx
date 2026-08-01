import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getBoardById } from "@/lib/queries/boards"
import { getBoardContents } from "@/lib/queries/board-contents"
import { getMyRoleInWorkspace, getWorkspaceBySlug, getWorkspaceMembers } from "@/lib/queries/workspaces"
import { BoardCanvas } from "@/components/board/board-canvas"
import { BoardBackgroundPicker } from "@/components/board/board-background-picker"
import { MobileBoardHeader } from "@/components/board/mobile-board-header"

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string }>
}) {
  const { workspaceSlug, boardId } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const board = await getBoardById(boardId, session.user.id)
  if (!board) notFound()

  const [{ lists, cards }, myRole, members, workspace] = await Promise.all([
    getBoardContents(boardId, session.user.id),
    getMyRoleInWorkspace(board.workspaceId, session.user.id),
    getWorkspaceMembers(board.workspaceId, session.user.id),
    getWorkspaceBySlug(workspaceSlug, session.user.id),
  ])
  const canEdit = myRole === "owner" || myRole === "admin" || myRole === "editor"
  const canManageRoles = myRole === "owner" || myRole === "admin"

  return (
    <div className="flex h-full flex-col">
      <MobileBoardHeader
        board={board}
        workspaceSlug={workspaceSlug}
        workspaceId={board.workspaceId}
        workspaceName={workspace?.name ?? ""}
        members={members}
        canEdit={canEdit}
        canManageRoles={canManageRoles}
      />
      <div className="hidden items-center gap-2 px-6 pt-6 md:flex">
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
