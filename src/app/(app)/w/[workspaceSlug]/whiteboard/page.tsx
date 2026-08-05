import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getWorkspaceBySlug } from "@/lib/queries/workspaces"
import { getWorkspaceWhiteboard } from "@/lib/queries/whiteboard"
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas"

export default async function WhiteboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) notFound()

  const data = await getWorkspaceWhiteboard(workspace.id, session.user.id)

  return <WhiteboardCanvas workspaceId={workspace.id} workspaceSlug={workspaceSlug} initialData={data} />
}
