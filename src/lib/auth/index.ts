import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { user as userTable } from "@/db/schema"
import { reconcilePendingInvites } from "@/lib/invites"

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
    user: {
      additionalFields: {
        jobTitle: { type: "string", required: false, input: true },
        bio: { type: "string", required: false, input: true },
      },
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
