"use server"

import { and, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { workspaceInvites, workspaceMembers, workspaces } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import { ForbiddenError, requireWorkspaceAdmin, requireWorkspaceOwner } from "@/lib/authz/guards"
import { slugify } from "@/lib/slug"

export async function createWorkspaceAction(name: string) {
  const session = await requireSession()
  const db = getDb()

  const id = crypto.randomUUID()
  const slug = slugify(name)

  await db.batch([
    db.insert(workspaces).values({ id, name, slug, createdBy: session.user.id }),
    db.insert(workspaceMembers).values({ workspaceId: id, userId: session.user.id, role: "owner" }),
  ])

  return { id, name, slug }
}

export async function createInviteAction(
  workspaceId: string,
  email: string,
  role: "admin" | "editor" | "member"
) {
  const session = await requireSession()
  await requireWorkspaceAdmin(workspaceId, session.user.id)

  const db = getDb()
  const [invite] = await db
    .insert(workspaceInvites)
    .values({ workspaceId, email, role, invitedBy: session.user.id })
    .returning({ id: workspaceInvites.id, email: workspaceInvites.email, role: workspaceInvites.role })

  return invite
}

export async function updateMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  role: "admin" | "editor" | "member"
) {
  const session = await requireSession()
  await requireWorkspaceAdmin(workspaceId, session.user.id)

  const db = getDb()
  const [target] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)))

  if (!target) throw new ForbiddenError("Not a workspace member")
  // Ownership transfer isn't supported here — the owner's role can't be
  // changed through this action.
  if (target.role === "owner") throw new ForbiddenError("Cannot change the owner's role")

  await db
    .update(workspaceMembers)
    .set({ role })
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)))
}

export async function updateWorkspaceDriveUrlAction(workspaceId: string, driveUrl: string) {
  const session = await requireSession()
  await requireWorkspaceAdmin(workspaceId, session.user.id)

  const db = getDb()
  await db
    .update(workspaces)
    .set({ driveUrl: driveUrl || null })
    .where(eq(workspaces.id, workspaceId))
}

export async function renameWorkspaceAction(workspaceId: string, name: string) {
  const session = await requireSession()
  await requireWorkspaceAdmin(workspaceId, session.user.id)

  const db = getDb()
  await db.update(workspaces).set({ name }).where(eq(workspaces.id, workspaceId))
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const session = await requireSession()
  await requireWorkspaceOwner(workspaceId, session.user.id)

  const db = getDb()
  // Cascades to workspaceMembers/workspaceInvites/boards (and, through boards,
  // to lists/cards/labels/checklists/comments/attachments) via existing FKs.
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId))
}
