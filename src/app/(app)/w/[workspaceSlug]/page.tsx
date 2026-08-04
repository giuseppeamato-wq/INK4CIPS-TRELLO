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
    <div className="relative flex flex-1 flex-col md:p-0">
      {/* No mobile title here: the workspace name + avatar already live in
          WorkspaceSidebar's mobile bar (matches the design's single combined
          header), so this page only needs the search box + board grid. */}
      <WorkspaceBoardsGrid
        boards={boards}
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        workspaceName={workspace.name}
        canEdit={canEdit}
      />

      {/* Mobile: floating actions, matching the mockup's gear + plus FABs */}
      <div className="fixed bottom-[26px] left-[22px] md:hidden">
        <Link
          href={`/w/${workspaceSlug}/settings`}
          aria-label="Impostazioni workspace"
          className="flex size-12 items-center justify-center rounded-full border border-[#ececec] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
        >
          <Settings className="size-[19px] text-foreground" />
        </Link>
      </div>
      <div className="fixed right-[22px] bottom-[26px] md:hidden">
        <CreateBoardDialog
          workspaceId={workspace.id}
          trigger={
            <button
              type="button"
              aria-label="Nuova board"
              className="flex size-[52px] items-center justify-center rounded-full bg-[#1a1a1a] shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
            >
              <Plus className="size-[22px] text-white" />
            </button>
          }
        />
      </div>
    </div>
  )
}
