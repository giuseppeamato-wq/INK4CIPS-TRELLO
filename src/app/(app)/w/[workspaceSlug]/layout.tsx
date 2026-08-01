import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getUserWorkspaces, getWorkspaceBySlug } from "@/lib/queries/workspaces"
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar"

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
      <WorkspaceSidebar workspaces={workspaces} currentSlug={workspaceSlug} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
