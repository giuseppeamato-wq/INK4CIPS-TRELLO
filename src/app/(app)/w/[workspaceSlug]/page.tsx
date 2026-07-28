import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getMyRoleInWorkspace, getWorkspaceBySlug } from "@/lib/queries/workspaces"
import { getBoardsForWorkspace } from "@/lib/queries/boards"
import { CreateBoardDialog } from "@/components/workspace/create-board-dialog"
import { BoardCard } from "@/components/workspace/board-card"

export default async function WorkspaceBoardsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) notFound()

  const [boards, myRole] = await Promise.all([
    getBoardsForWorkspace(workspace.id, session.user.id),
    getMyRoleInWorkspace(workspace.id, session.user.id),
  ])
  const canEdit = myRole === "owner" || myRole === "admin" || myRole === "editor"

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold">{workspace.name}</h1>
        <CreateBoardDialog workspaceId={workspace.id} />
      </div>

      {boards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nessuna board ancora. Creane una per iniziare a organizzare il lavoro.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} workspaceSlug={workspaceSlug} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  )
}
