import { getEnv } from "@/lib/cf/context"
import type { BoardEvent } from "@/durable-objects/board-room"

export async function broadcastToBoard(boardId: string, event: BoardEvent) {
  const env = getEnv()
  const id = env.BOARD_ROOM.idFromName(boardId)
  const stub = env.BOARD_ROOM.get(id)
  // Fire-and-forget from the caller's perspective — the DO broadcast is a
  // best-effort fan-out to currently connected clients, D1 already has the
  // durable write by the time this runs.
  await stub.fetch("https://internal/broadcast", {
    method: "POST",
    body: JSON.stringify(event),
  })
}
