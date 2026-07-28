import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import {
  getMyRoleInWorkspace,
  getPendingInvites,
  getWorkspaceBySlug,
  getWorkspaceMembers,
} from "@/lib/queries/workspaces"
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog"
import { MemberRoleSelect } from "@/components/workspace/member-role-select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug, session.user.id)
  if (!workspace) notFound()

  const [members, invites, myRole] = await Promise.all([
    getWorkspaceMembers(workspace.id, session.user.id),
    getPendingInvites(workspace.id, session.user.id),
    getMyRoleInWorkspace(workspace.id, session.user.id),
  ])

  const canManage = myRole === "owner" || myRole === "admin"

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold">
          Impostazioni · {workspace.name}
        </h1>
        {canManage && <InviteMemberDialog workspaceId={workspace.id} />}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Membri</h2>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <Avatar className="size-8">
                <AvatarFallback>
                  {(m.name ?? m.email ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{m.name ?? m.email}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              {canManage && m.role !== "owner" ? (
                <MemberRoleSelect
                  workspaceId={workspace.id}
                  userId={m.userId}
                  role={m.role as "admin" | "editor" | "member"}
                />
              ) : (
                <Badge variant="outline">{m.role}</Badge>
              )}
            </div>
          ))}
        </div>
      </section>

      {canManage && invites.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Inviti in attesa
          </h2>
          <div className="flex flex-col gap-2">
            {invites.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 rounded-md border border-dashed p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{i.email}</p>
                </div>
                <Badge variant="outline">{i.role}</Badge>
                <Badge variant="secondary">in attesa</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
