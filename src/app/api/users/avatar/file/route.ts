import { getSession } from "@/lib/auth/session"
import { getEnv } from "@/lib/cf/context"

// Avatars are visible to any signed-in teammate (e.g. next to their name in
// a workspace), so this only requires *a* session, not ownership of the key.
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const key = new URL(request.url).searchParams.get("key")
  if (!key || !key.startsWith("avatars/")) return new Response("Bad request", { status: 400 })

  const env = getEnv()
  const object = await env.ATTACHMENTS.get(key)
  if (!object) return new Response("Not found", { status: 404 })

  const headers = new Headers()
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream")
  headers.set("Cache-Control", "private, max-age=300")

  return new Response(object.body, { headers })
}
