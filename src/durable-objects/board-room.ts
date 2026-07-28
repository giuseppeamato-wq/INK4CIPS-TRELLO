import { DurableObject } from "cloudflare:workers"

export type BoardEvent =
  | { type: "list.created"; list: { id: string; name: string; sortKey: string } }
  | { type: "list.moved"; listId: string; sortKey: string }
  | { type: "list.renamed"; listId: string; name: string }
  | { type: "list.deleted"; listId: string }
  | {
      type: "card.created"
      card: { id: string; listId: string; title: string; sortKey: string; dueDate: string | null }
    }
  | { type: "card.moved"; cardId: string; listId: string; sortKey: string }
  | { type: "card.renamed"; cardId: string; title: string }
  | { type: "card.deleted"; cardId: string }

// One instance per board (addressed via idFromName(boardId)). Holds no
// durable state of its own — D1 is always the source of truth (see the
// Server Actions in src/lib/actions/) — this DO is purely an ephemeral
// fan-out layer for WebSocket clients currently viewing that board.
export class BoardRoom extends DurableObject<CloudflareEnv> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === "POST" && url.pathname === "/broadcast") {
      const event = await request.json()
      const payload = JSON.stringify(event)
      for (const ws of this.ctx.getWebSockets()) {
        ws.send(payload)
      }
      return new Response(null, { status: 204 })
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.ctx.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage() {
    // Clients are receive-only for now — mutations always go through
    // Server Actions, never through the socket itself.
  }

  async webSocketClose() {
    // Notification that the client's socket already closed — nothing to
    // clean up, this DO holds no per-connection state beyond what
    // ctx.getWebSockets() already tracks. Calling ws.close() here (on an
    // already-closed socket) throws, which is why this is a no-op.
  }
}
