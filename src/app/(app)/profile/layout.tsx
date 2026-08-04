import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getUserWorkspaces } from "@/lib/queries/workspaces"
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar"

// Profile and its subpages (edit, notifications, help) sit inside the same
// persistent sidebar as the workspace/board views in the design — none of
// the workspace rows highlight here since there's no "current" workspace.
export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const workspaces = await getUserWorkspaces(session.user.id)

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <WorkspaceSidebar
        workspaces={workspaces}
        currentUser={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
        }}
        hideMobileBar
      />
      <div className="relative flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
