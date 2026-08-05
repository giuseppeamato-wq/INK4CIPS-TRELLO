import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { boardWhiteboards } from "@/db/schema"
import { requireBoardMember } from "@/lib/authz/guards"

export type WhiteboardNode = {
  id: string
  x: number
  y: number
  w: number
  h: number
  shape: "rect" | "pill" | "circle" | "text" | "sticky"
  color: string
  text: string
  rotate?: number
}

export type WhiteboardEdge = {
  id: string
  fromId: string
  toId: string
}

export type WhiteboardData = {
  nodes: WhiteboardNode[]
  edges: WhiteboardEdge[]
}

// First-ever open of a board's whiteboard isn't blank — same seed as the
// design prototype (two connected example nodes) so the empty state doesn't
// look broken.
function seedWhiteboardData(): WhiteboardData {
  return {
    nodes: [
      { id: "n1", x: 120, y: 200, w: 170, h: 44, shape: "pill", color: "#f2c94c", text: "Idea" },
      { id: "n2", x: 400, y: 200, w: 170, h: 44, shape: "pill", color: "#3fc7a6", text: "Risultato" },
    ],
    edges: [{ id: "e1", fromId: "n1", toId: "n2" }],
  }
}

export async function getBoardWhiteboard(boardId: string, requestingUserId: string): Promise<WhiteboardData> {
  await requireBoardMember(boardId, requestingUserId)

  const db = getDb()
  const [row] = await db
    .select({ data: boardWhiteboards.data })
    .from(boardWhiteboards)
    .where(eq(boardWhiteboards.boardId, boardId))

  if (!row) return seedWhiteboardData()

  try {
    const parsed = JSON.parse(row.data)
    return { nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] }
  } catch {
    return seedWhiteboardData()
  }
}
