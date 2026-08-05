import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getBoardById } from "@/lib/queries/boards"
import { getBoardWhiteboard } from "@/lib/queries/whiteboard"
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas"

export default async function BoardWhiteboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string }>
}) {
  const { workspaceSlug, boardId } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const board = await getBoardById(boardId, session.user.id)
  if (!board) notFound()

  const data = await getBoardWhiteboard(boardId, session.user.id)

  return (
    <WhiteboardCanvas
      boardId={boardId}
      boardName={board.name}
      backHref={`/w/${workspaceSlug}/b/${boardId}`}
      initialData={data}
    />
  )
}
