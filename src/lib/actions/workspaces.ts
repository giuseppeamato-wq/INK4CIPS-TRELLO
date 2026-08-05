"use server"

import { and, eq, sql } from "drizzle-orm"
import { getDb } from "@/db"
import { user as userTable, workspaceInvites, workspaceMembers, workspaces } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"
import { ForbiddenError, requireWorkspaceAdmin, requireWorkspaceOwner } from "@/lib/authz/guards"
import { reconcilePendingInvites } from "@/lib/invites"
import { createNotification } from "@/lib/notifications/create"
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
    .returning({
      id: workspaceInvites.id,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      token: workspaceInvites.token,
    })

  // If the invited email already belongs to an account, don't make them
  // wait for their next login to see the workspace — an already-signed-in
  // colleague otherwise never gets a fresh session, so the invite would sit
  // as "pending" indefinitely (see reconcilePendingInvites' other call sites
  // in src/lib/auth/index.ts, which only fire on signup/login).
  const [existingUser] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(sql`lower(${userTable.email})`, email.toLowerCase()))
  if (existingUser) {
    await reconcilePendingInvites(db, email, existingUser.id)
  }

  return invite
}

export async function acceptInviteByTokenAction(token: string) {
  const session = await requireSession()
  const db = getDb()

  const [invite] = await db
    .select({
      id: workspaceInvites.id,
      workspaceId: workspaceInvites.workspaceId,
      role: workspaceInvites.role,
      status: workspaceInvites.status,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvites.workspaceId))
    .where(eq(workspaceInvites.token, token))

  if (!invite || invite.status !== "pending") {
    throw new Error("Invito non valido o già usato")
  }

  await db.batch([
    db
      .insert(workspaceMembers)
      .values({ workspaceId: invite.workspaceId, userId: session.user.id, role: invite.role })
      .onConflictDoNothing(),
    db.update(workspaceInvites).set({ status: "accepted" }).where(eq(workspaceInvites.id, invite.id)),
  ])

  try {
    await createNotification({
      userId: session.user.id,
      type: "workspace_invite",
      message: `Sei stato aggiunto al workspace "${invite.workspaceName}"`,
      url: `/w/${invite.workspaceSlug}`,
    })
  } catch {
    // Best-effort — a notification failure shouldn't undo the join above.
  }

  return { workspaceSlug: invite.workspaceSlug }
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
