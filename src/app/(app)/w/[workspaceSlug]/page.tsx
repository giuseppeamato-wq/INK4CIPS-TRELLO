import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Plus, Settings } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getMyRoleInWorkspace, getWorkspaceBySlug } from "@/lib/queries/workspaces"
import { getBoardsForWorkspace } from "@/lib/queries/boards"
import { CreateBoardDialog } from "@/components/workspace/create-board-dialog"
import { WorkspaceBoardsGrid } from "@/components/workspace/workspace-boards-grid"

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
    <div className="relative flex flex-1 flex-col gap-2 p-5 md:gap-0 md:p-0">
      {/* Mobile-only title; desktop renders its own header inside the grid
          component so the search box and "Nuovo board" button can sit on
          the same row as the title, matching the design exactly. */}
      <div className="md:hidden">
        <div className="text-xs font-medium text-muted-foreground">Workspace</div>
        <h1 className="font-heading text-lg font-semibold">{workspace.name}</h1>
      </div>

      <WorkspaceBoardsGrid
        boards={boards}
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        workspaceName={workspace.name}
        canEdit={canEdit}
      />

      {/* Mobile: floating actions, matching the mockup's gear + plus FABs */}
      <div className="fixed bottom-6 left-5 md:hidden">
        <Link
          href={`/w/${workspaceSlug}/settings`}
          aria-label="Impostazioni workspace"
          className="flex size-12 items-center justify-center rounded-full border bg-background shadow-lg"
        >
          <Settings className="size-[19px]" />
        </Link>
      </div>
      <div className="fixed right-5 bottom-6 md:hidden">
        <CreateBoardDialog
          workspaceId={workspace.id}
          trigger={
            <button
              type="button"
              aria-label="Nuova board"
              className="flex size-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
            >
              <Plus className="size-[22px]" />
            </button>
          }
        />
      </div>
    </div>
  )
}
