import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { getEnv } from "@/lib/cf/context"
import { attachments } from "@/db/schema"
import { getSession } from "@/lib/auth/session"
import { ForbiddenError, requireCardMember } from "@/lib/authz/guards"

async function loadAttachment(attachmentId: string) {
  const db = getDb()
  const [attachment] = await db.select().from(attachments).where(eq(attachments.id, attachmentId))
  return attachment ?? null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { attachmentId } = await params
  const attachment = await loadAttachment(attachmentId)
  if (!attachment) return new Response("Not found", { status: 404 })

  try {
    await requireCardMember(attachment.cardId, session.user.id)
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 })
    throw err
  }

  const env = getEnv()
  const object = await env.ATTACHMENTS.get(attachment.storagePath)
  if (!object) return new Response("Not found", { status: 404 })

  const headers = new Headers()
  headers.set("Content-Type", attachment.contentType ?? "application/octet-stream")
  headers.set("Content-Disposition", `attachment; filename="${attachment.fileName}"`)
  if (attachment.sizeBytes) headers.set("Content-Length", String(attachment.sizeBytes))

  return new Response(object.body, { headers })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { attachmentId } = await params
  const attachment = await loadAttachment(attachmentId)
  if (!attachment) return new Response("Not found", { status: 404 })

  try {
    await requireCardMember(attachment.cardId, session.user.id)
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 })
    throw err
  }

  const env = getEnv()
  await env.ATTACHMENTS.delete(attachment.storagePath)

  const db = getDb()
  await db.delete(attachments).where(eq(attachments.id, attachmentId))

  return new Response(null, { status: 204 })
}
