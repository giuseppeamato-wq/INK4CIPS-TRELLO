import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { and, eq, sql } from "drizzle-orm"
import { getDb } from "@/db"
import { user as userTable, workspaceInvites, workspaceMembers } from "@/db/schema"

type Db = ReturnType<typeof getDb>

// Links a user (new signup, or an existing account that was invited after
// the fact — see session.create.after below) to every workspace they have a
// still-pending invite for, matched case-insensitively on email.
async function reconcilePendingInvites(db: Db, email: string, userId: string) {
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
}

// Accepts an explicit env for call sites outside the Next.js request scope
// (see src/db/index.ts's getDb for why).
export function getAuth(env?: CloudflareEnv) {
  const db = getDb(env)

  return betterAuth({
    secret: env?.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET,
    baseURL: env?.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: "sqlite" }),
    emailAndPassword: {
      enabled: true,
      // MVP: nessun provider email configurato. Il vero cancello di accesso
      // resta l'invito via workspace_invites, quindi un self-signup senza
      // verifica non apre accesso a nessun workspace.
      requireEmailVerification: false,
    },
    session: {
      cookieCache: { enabled: true, maxAge: 60 },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (newUser) => {
            await reconcilePendingInvites(db, newUser.email, newUser.id)
          },
        },
      },
      session: {
        create: {
          // Covers the case the signup-time hook above misses: someone who
          // already had an account before being invited. Their invite sits
          // as "pending" forever otherwise, since it's only ever matched
          // against *new* signups. Re-checking on every new session (i.e.
          // roughly once per login, not per request — sessions are cached)
          // catches that case too.
          after: async (newSession) => {
            const [u] = await db
              .select({ email: userTable.email })
              .from(userTable)
              .where(eq(userTable.id, newSession.userId))
            if (u) await reconcilePendingInvites(db, u.email, newSession.userId)
          },
        },
      },
    },
  })
}
