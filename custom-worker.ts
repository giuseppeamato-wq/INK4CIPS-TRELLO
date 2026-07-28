import { default as handler } from "./.open-next/worker.js"
import { BoardRoom } from "./src/durable-objects/board-room"
import { getAuth } from "./src/lib/auth"
import { requireBoardMember, ForbiddenError } from "./src/lib/authz/guards"

export { BoardRoom }

const BOARD_WS_PATTERN = /^\/api\/boards\/([^/]+)\/ws$/

async function handleBoardWebSocket(
  request: Request,
  env: CloudflareEnv,
  boardId: string
): Promise<Response> {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 426 })
  }

  const session = await getAuth(env).api.getSession({ headers: request.headers })
  if (!session) return new Response("Unauthorized", { status: 401 })

  try {
    await requireBoardMember(boardId, session.user.id, env)
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Forbidden", { status: 403 })
    throw err
  }

  const id = env.BOARD_ROOM.idFromName(boardId)
  const stub = env.BOARD_ROOM.get(id)
  return stub.fetch(request)
}

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    const url = new URL(request.url)
    const match = url.pathname.match(BOARD_WS_PATTERN)

    // WebSocket upgrades are intercepted here, before Next.js's router ever
    // sees the request — Next.js Route Handlers can't reliably proxy a raw
    // 101/webSocket Response through the framework's request/response
    // handling, so this bypasses it entirely for this one path.
    if (match) {
      return handleBoardWebSocket(request, env, match[1])
    }

    return handler.fetch(request, env, ctx)
  },
} satisfies ExportedHandler<CloudflareEnv>
