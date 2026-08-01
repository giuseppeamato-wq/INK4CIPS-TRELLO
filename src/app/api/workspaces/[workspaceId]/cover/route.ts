import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { getEnv } from "@/lib/cf/context"
import { workspaces } from "@/db/schema"
import { getSession } from "@/lib/auth/session"
import { ForbiddenError, requireWorkspaceAdmin, requireWorkspaceMember } from "@/lib/authz/guards"

async function loadWorkspace(workspaceId: string) {
  const db = getDb()
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId))
  return workspace ?? null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { workspaceId } = await params
  const workspace = await loadWorkspace(workspaceId)
  if (!workspace?.coverPath) return new Response("Not found", { status: 404 })

  try {
    await requireWorkspaceMember(workspaceId, session.user.id)
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 })
    throw err
  }

  const env = getEnv()
  const object = await env.ATTACHMENTS.get(workspace.coverPath)
  if (!object) return new Response("Not found", { status: 404 })

  const headers = new Headers()
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream")
  headers.set("Cache-Control", "private, max-age=300")

  return new Response(object.body, { headers })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { workspaceId } = await params
  const workspace = await loadWorkspace(workspaceId)
  if (!workspace) return new Response("Not found", { status: 404 })

  try {
    await requireWorkspaceAdmin(workspaceId, session.user.id)
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 })
    throw err
  }

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return new Response("Bad request", { status: 400 })
  }

  const env = getEnv()
  const coverPath = `workspace-covers/${workspaceId}/${crypto.randomUUID()}-${file.name}`
  await env.ATTACHMENTS.put(coverPath, file, {
    httpMetadata: { contentType: file.type },
  })

  const previousPath = workspace.coverPath
  const db = getDb()
  await db.update(workspaces).set({ coverPath }).where(eq(workspaces.id, workspaceId))
  if (previousPath) await env.ATTACHMENTS.delete(previousPath)

  return Response.json({ coverPath })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { workspaceId } = await params
  const workspace = await loadWorkspace(workspaceId)
  if (!workspace) return new Response("Not found", { status: 404 })

  try {
    await requireWorkspaceAdmin(workspaceId, session.user.id)
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 })
    throw err
  }

  if (workspace.coverPath) {
    const env = getEnv()
    await env.ATTACHMENTS.delete(workspace.coverPath)
  }

  const db = getDb()
  await db.update(workspaces).set({ coverPath: null }).where(eq(workspaces.id, workspaceId))

  return new Response(null, { status: 204 })
}
