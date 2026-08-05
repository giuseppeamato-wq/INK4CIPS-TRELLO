import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import {
  getMyRoleInWorkspace,
  getPendingInvites,
  getWorkspaceBySlug,
  getWorkspaceMembers,
} from "@/lib/queries/workspaces"
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog"
import { MemberRoleSelect } from "@/components/workspace/member-role-select"
import { WorkspaceDriveUrlField } from "@/components/workspace/workspace-drive-url-field"
import { CopyInviteLinkButton } from "@/components/workspace/copy-invite-link-button"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  member: "Membro",
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase">{children}</div>
  )
}

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

  const backButton = (
    <Link
      href={`/w/${workspaceSlug}`}
      aria-label="Torna al workspace"
      className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-ink-soft md:size-9"
    >
      <ChevronLeft className="size-4 text-foreground" />
    </Link>
  )

  return (
    <div className="flex flex-1 flex-col">
      {/* Mobile: back+invite row, title stacked below (matches board-header's
          mobile layout instead of squeezing everything onto one line). */}
      <div className="px-[18px] pt-[18px] pb-2 md:hidden">
        <div className="flex items-center justify-between gap-2">
          {backButton}
          {canManage && <InviteMemberDialog workspaceId={workspace.id} />}
        </div>
        <div className="mt-3.5 truncate font-heading text-[17px] font-bold text-foreground">
          Impostazioni · {workspace.name}
        </div>
      </div>

      {/* Desktop: back+title inline, invite button on the right. */}
      <div className="hidden items-center justify-between gap-3.5 px-9 pt-6 pb-2 md:flex">
        <div className="flex min-w-0 items-center gap-3.5">
          {backButton}
          <span className="truncate font-heading text-[19px] font-bold text-foreground">
            Impostazioni · {workspace.name}
          </span>
        </div>
        {canManage && <InviteMemberDialog workspaceId={workspace.id} />}
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 p-5 md:p-9">
        <SectionLabel>Membri</SectionLabel>
        <div className="mb-7 flex flex-col overflow-hidden rounded-[14px] border border-border">
          {members.map((m, i) => (
            <div
              key={m.userId}
              className={cn(
                "flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-3",
                i > 0 && "border-t border-[#f2f2f2]"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-xs font-bold text-foreground">
                  {(m.name ?? m.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-foreground">{m.name ?? m.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              {canManage && m.role !== "owner" ? (
                <MemberRoleSelect
                  workspaceId={workspace.id}
                  userId={m.userId}
                  role={m.role as "admin" | "editor" | "member"}
                />
              ) : (
                <span className="self-start rounded-full bg-ink-soft px-2.5 py-1 text-[11px] font-bold text-muted-foreground sm:shrink-0 sm:self-auto">
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
              )}
            </div>
          ))}
        </div>

        {canManage && invites.length > 0 && (
          <>
            <SectionLabel>Inviti in attesa</SectionLabel>
            <div className="mb-7 flex flex-col overflow-hidden rounded-[14px] border border-dashed border-border">
              {invites.map((i, idx) => (
                <div
                  key={i.id}
                  className={cn(
                    "flex items-center gap-3 p-3.5",
                    idx > 0 && "border-t border-dashed border-[#f2f2f2]"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">{i.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-ink-soft px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    {ROLE_LABELS[i.role] ?? i.role}
                  </span>
                  {i.token && <CopyInviteLinkButton token={i.token} />}
                </div>
              ))}
            </div>
          </>
        )}

        {canManage && (
          <>
            <SectionLabel>Google Drive</SectionLabel>
            <p className="mb-3 text-xs text-muted-foreground">
              Link alla cartella Drive di questo workspace — comparirà come icona accanto al nome nella sidebar.
            </p>
            <WorkspaceDriveUrlField workspaceId={workspace.id} driveUrl={workspace.driveUrl} />
          </>
        )}
      </div>
    </div>
  )
}
