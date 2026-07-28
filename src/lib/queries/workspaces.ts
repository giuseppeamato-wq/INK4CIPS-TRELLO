import { and, desc, eq, inArray } from "drizzle-orm"
import { getDb } from "@/db"
import { user, workspaceInvites, workspaceMembers, workspaces } from "@/db/schema"
import { requireWorkspaceMember } from "@/lib/authz/guards"

export async function getUserWorkspaces(userId: string) {
  const db = getDb()
  const memberships = await db
    .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))

  if (!memberships.length) return []

  const rows = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, createdAt: workspaces.createdAt })
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

export async function getWorkspaceBySlug(slug: string, userId: string) {
  const db = getDb()
  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, createdBy: workspaces.createdBy })
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
      createdAt: workspaceInvites.createdAt,
    })
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.workspaceId, workspaceId), eq(workspaceInvites.status, "pending")))
    .orderBy(desc(workspaceInvites.createdAt))
}
