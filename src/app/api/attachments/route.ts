import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { getEnv } from "@/lib/cf/context"
import { attachments, boards, cards } from "@/db/schema"
import { getSession } from "@/lib/auth/session"
import { ForbiddenError, requireCardMember } from "@/lib/authz/guards"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const formData = await request.formData()
  const cardId = formData.get("cardId")
  const file = formData.get("file")
  if (typeof cardId !== "string" || !(file instanceof File)) {
    return new Response("Bad request", { status: 400 })
  }

  try {
    await requireCardMember(cardId, session.user.id)
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 })
    throw err
  }

  const db = getDb()
  const [card] = await db.select({ boardId: cards.boardId }).from(cards).where(eq(cards.id, cardId))
  if (!card) return new Response("Card not found", { status: 404 })
  const [board] = await db.select({ workspaceId: boards.workspaceId }).from(boards).where(eq(boards.id, card.boardId))
  if (!board) return new Response("Board not found", { status: 404 })

  const attachmentId = crypto.randomUUID()
  const storagePath = `${board.workspaceId}/${card.boardId}/${cardId}/${attachmentId}-${file.name}`

  const env = getEnv()
  // Pass the File (a Blob) directly rather than file.stream() — R2's put()
  // needs a known content length up front, which a bare ReadableStream
  // doesn't carry but a Blob does via its own .size.
  await env.ATTACHMENTS.put(storagePath, file, {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  })

  const [attachment] = await db
    .insert(attachments)
    .values({
      id: attachmentId,
      cardId,
      uploadedBy: session.user.id,
      storagePath,
      fileName: file.name,
      contentType: file.type || null,
      sizeBytes: file.size,
    })
    .returning()

  return Response.json(attachment)
}
