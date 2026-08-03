"use server"

import { and, eq } from "drizzle-orm"
import { verifyPassword } from "better-auth/crypto"
import { getDb } from "@/db"
import { account } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"

// Re-authentication gate for destructive actions (e.g. deleting a card) —
// checks the current user's own password without creating a new session,
// unlike calling authClient.signIn.email() again would.
export async function verifyCurrentPasswordAction(password: string): Promise<boolean> {
  const session = await requireSession()
  const db = getDb()
  const [row] = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, session.user.id), eq(account.providerId, "credential")))

  if (!row?.password) return false
  return verifyPassword({ hash: row.password, password })
}
