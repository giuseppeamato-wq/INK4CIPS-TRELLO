import { getSession } from "@/lib/auth/session"
import { getEnv } from "@/lib/cf/context"

// Uploads/serves the current user's avatar image on R2. Unlike the
// workspace-cover route, the R2 key is never persisted to the DB directly:
// this route only manages storage and hands back a serving URL; the caller
// persists it via authClient.updateUser({ image }) so better-auth's own
// session cache stays in sync (see EditProfileForm).
const KEY_PREFIX = "avatars/"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return new Response("Bad request", { status: 400 })
  }

  const env = getEnv()
  const key = `${KEY_PREFIX}${session.user.id}/${crypto.randomUUID()}-${file.name}`
  await env.ATTACHMENTS.put(key, file, { httpMetadata: { contentType: file.type } })

  // Best-effort cleanup of the previous avatar object, if any.
  const previousImage = session.user.image
  if (previousImage?.startsWith("/api/users/avatar/file?key=")) {
    const previousKey = decodeURIComponent(previousImage.split("key=")[1] ?? "")
    if (previousKey.startsWith(`${KEY_PREFIX}${session.user.id}/`)) {
      await env.ATTACHMENTS.delete(previousKey).catch(() => {})
    }
  }

  const image = `/api/users/avatar/file?key=${encodeURIComponent(key)}`
  return Response.json({ image })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const previousImage = session.user.image
  if (previousImage?.startsWith("/api/users/avatar/file?key=")) {
    const env = getEnv()
    const previousKey = decodeURIComponent(previousImage.split("key=")[1] ?? "")
    if (previousKey.startsWith(`${KEY_PREFIX}${session.user.id}/`)) {
      await env.ATTACHMENTS.delete(previousKey).catch(() => {})
    }
  }

  return new Response(null, { status: 204 })
}
