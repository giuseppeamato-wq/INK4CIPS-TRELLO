import { and, desc, eq, inArray } from "drizzle-orm"
import { getDb } from "@/db"
import { boards, user, workspaceInvites, workspaceMembers, workspaces } from "@/db/schema"
import { requireWorkspaceMember } from "@/lib/authz/guards"

export async function getUserWorkspaces(userId: string) {
  const db = getDb()
  const memberships = await db
    .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))

  if (!memberships.length) return []

  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      driveUrl: workspaces.driveUrl,
      coverPath: workspaces.coverPath,
      createdAt: workspaces.createdAt,
    })
    .from(workspaces)
    .where(
      inArray(
        workspaces.id,
        memberships.map((m) => m.workspaceId)
      )
    )

  const roleByWorkspace = new Map(memberships.map((m) => [m.workspaceId, m.role]))
  return rows
    .map((w) => ({ ...w, role: roleByWorkspace.get(w.id)! }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

export async function getUserWorkspacesWithBoardCount(userId: string) {
  const workspacesList = await getUserWorkspaces(userId)
  if (!workspacesList.length) return []

  const db = getDb()
  const boardRows = await db
    .select({ workspaceId: boards.workspaceId })
    .from(boards)
    .where(
      and(
        inArray(
          boards.workspaceId,
          workspacesList.map((w) => w.id)
        ),
        eq(boards.archived, false)
      )
    )

  const countByWorkspace = new Map<string, number>()
  for (const row of boardRows) {
    countByWorkspace.set(row.workspaceId, (countByWorkspace.get(row.workspaceId) ?? 0) + 1)
  }

  return workspacesList.map((w) => ({ ...w, boardCount: countByWorkspace.get(w.id) ?? 0 }))
}

export async function getWorkspaceBySlug(slug: string, userId: string) {
  const db = getDb()
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      driveUrl: workspaces.driveUrl,
      createdBy: workspaces.createdBy,
    })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))

  if (!workspace) return null
  // Not a member (or workspace doesn't exist) look the same to the caller —
  // no RLS to fall back on, so this check is the only thing standing between
  // "not found" and "found but not yours".
  const role = await requireWorkspaceMember(workspace.id, userId).catch(() => null)
  if (!role) return null

  return workspace
}

export async function getMyRoleInWorkspace(workspaceId: string, userId: string) {
  const db = getDb()
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
  return row?.role ?? null
}

export async function getWorkspaceMembers(workspaceId: string, requestingUserId: string) {
  await requireWorkspaceMember(workspaceId, requestingUserId)
  const db = getDb()
  return db
    .select({
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      createdAt: workspaceMembers.createdAt,
      email: user.email,
      name: user.name,
      image: user.image,
    })
    .from(workspaceMembers)
    .innerJoin(user, eq(user.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
}

export async function getPendingInvites(workspaceId: string, requestingUserId: string) {
  await requireWorkspaceMember(workspaceId, requestingUserId)
  const db = getDb()
  return db
    .select({
      id: workspaceInvites.id,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      token: workspaceInvites.token,
      createdAt: workspaceInvites.createdAt,
    })
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.workspaceId, workspaceId), eq(workspaceInvites.status, "pending")))
    .orderBy(desc(workspaceInvites.createdAt))
}

// Public lookup for the /invite/[token] landing page — no membership guard,
// since the whole point is that someone without an account yet can open it.
export async function getInviteByToken(token: string) {
  const db = getDb()
  const [invite] = await db
    .select({
      id: workspaceInvites.id,
      role: workspaceInvites.role,
      status: workspaceInvites.status,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvites.workspaceId))
    .where(eq(workspaceInvites.token, token))

  return invite ?? null
}
