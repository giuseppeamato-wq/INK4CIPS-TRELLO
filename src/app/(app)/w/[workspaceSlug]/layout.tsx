import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getUserWorkspaces, getWorkspaceBySlug } from "@/lib/queries/workspaces"
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar"
import { WorkspaceDriveFab } from "@/components/workspace/workspace-drive-fab"
import { WorkspaceWhiteboardFab } from "@/components/workspace/workspace-whiteboard-fab"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const [workspace, workspaces] = await Promise.all([
    getWorkspaceBySlug(workspaceSlug, session.user.id),
    getUserWorkspaces(session.user.id),
  ])

  // Non c'è RLS a fare da rete di sicurezza qui: getWorkspaceBySlug verifica
  // esplicitamente l'appartenenza, quindi null vuol dire "non esiste o non
  // ne fai parte" in entrambi i casi, indistinguibili di proposito.
  if (!workspace) notFound()

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <WorkspaceSidebar
        workspaces={workspaces}
        currentSlug={workspaceSlug}
        currentUser={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
        }}
      />
      <div className="relative flex-1 overflow-y-auto">
        {children}
        <div className="fixed right-5 bottom-5 z-20 hidden flex-col gap-3 md:flex">
          <WorkspaceWhiteboardFab workspaceSlug={workspaceSlug} />
          <WorkspaceDriveFab driveUrl={workspace.driveUrl} />
        </div>
      </div>
    </div>
  )
}
