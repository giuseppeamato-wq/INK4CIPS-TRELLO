import { and, eq, inArray, sql } from "drizzle-orm"
import { getDb } from "@/db"
import { workspaceInvites, workspaceMembers, workspaces } from "@/db/schema"
import { createNotification } from "@/lib/notifications/create"

type Db = ReturnType<typeof getDb>

// Links a user (new signup, an existing account logging in after being
// invited, or — see createInviteAction — an existing account invited while
// already signed in) to every workspace they have a still-pending invite
// for, matched case-insensitively on email.
export async function reconcilePendingInvites(db: Db, email: string, userId: string) {
  const emailLower = email.toLowerCase()
  const pending = await db
    .select()
    .from(workspaceInvites)
    .where(
      and(
        eq(sql`lower(${workspaceInvites.email})`, emailLower),
        eq(workspaceInvites.status, "pending")
      )
    )

  if (!pending.length) return

  const memberInserts = pending.map((invite) =>
    db
      .insert(workspaceMembers)
      .values({ workspaceId: invite.workspaceId, userId, role: invite.role })
      .onConflictDoNothing()
  )
  const markAccepted = db
    .update(workspaceInvites)
    .set({ status: "accepted" })
    .where(
      and(
        eq(sql`lower(${workspaceInvites.email})`, emailLower),
        eq(workspaceInvites.status, "pending")
      )
    )

  await db.batch([markAccepted, ...memberInserts])

  // Best-effort — a notification failure here shouldn't undo the join above.
  try {
    const joinedWorkspaces = await db
      .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
      .from(workspaces)
      .where(
        inArray(
          workspaces.id,
          pending.map((p) => p.workspaceId)
        )
      )
    await Promise.all(
      joinedWorkspaces.map((w) =>
        createNotification({
          userId,
          type: "workspace_invite",
          message: `Sei stato aggiunto al workspace "${w.name}"`,
          url: `/w/${w.slug}`,
        })
      )
    )
  } catch {
    // ignore
  }
}
