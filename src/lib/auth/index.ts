import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { and, eq, sql } from "drizzle-orm"
import { getDb } from "@/db"
import { workspaceInvites, workspaceMembers } from "@/db/schema"

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
            const email = newUser.email.toLowerCase()
            const pending = await db
              .select()
              .from(workspaceInvites)
              .where(
                and(
                  eq(sql`lower(${workspaceInvites.email})`, email),
                  eq(workspaceInvites.status, "pending")
                )
              )

            if (!pending.length) return

            const memberInserts = pending.map((invite) =>
              db
                .insert(workspaceMembers)
                .values({ workspaceId: invite.workspaceId, userId: newUser.id, role: invite.role })
                .onConflictDoNothing()
            )
            const markAccepted = db
              .update(workspaceInvites)
              .set({ status: "accepted" })
              .where(
                and(
                  eq(sql`lower(${workspaceInvites.email})`, email),
                  eq(workspaceInvites.status, "pending")
                )
              )

            await db.batch([markAccepted, ...memberInserts])
          },
        },
      },
    },
  })
}
