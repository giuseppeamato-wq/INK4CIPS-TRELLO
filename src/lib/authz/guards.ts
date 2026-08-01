import { and, eq } from "drizzle-orm"
import { getDb } from "@/db"
import { boards, cards, checklistItems, checklists, lists, workspaceMembers, type WorkspaceRole } from "@/db/schema"

export class ForbiddenError extends Error {}

export async function getWorkspaceRole(workspaceId: string, userId: string, env?: CloudflareEnv) {
  const db = getDb(env)
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
  return row?.role ?? null
}

export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string,
  env?: CloudflareEnv
): Promise<WorkspaceRole> {
  const role = await getWorkspaceRole(workspaceId, userId, env)
  if (!role) throw new ForbiddenError("Not a workspace member")
  return role
}

export async function requireWorkspaceAdmin(workspaceId: string, userId: string, env?: CloudflareEnv) {
  const role = await requireWorkspaceMember(workspaceId, userId, env)
  if (role !== "owner" && role !== "admin") throw new ForbiddenError("Requires admin/owner role")
  return role
}

export async function requireWorkspaceOwner(workspaceId: string, userId: string, env?: CloudflareEnv) {
  const role = await requireWorkspaceMember(workspaceId, userId, env)
  if (role !== "owner") throw new ForbiddenError("Requires owner role")
  return role
}

// Renaming/deleting boards, lists and cards requires editor-or-above — plain
// members can still create/comment/assign/etc, just not restructure or
// remove things. Member management stays admin/owner-only (requireWorkspaceAdmin).
export async function requireWorkspaceEditor(workspaceId: string, userId: string, env?: CloudflareEnv) {
  const role = await requireWorkspaceMember(workspaceId, userId, env)
  if (role !== "owner" && role !== "admin" && role !== "editor") {
    throw new ForbiddenError("Requires editor role or above")
  }
  return role
}

export async function getBoardWorkspaceId(boardId: string, env?: CloudflareEnv) {
  const db = getDb(env)
  const [row] = await db.select({ workspaceId: boards.workspaceId }).from(boards).where(eq(boards.id, boardId))
  return row?.workspaceId ?? null
}

export async function requireBoardMember(boardId: string, userId: string, env?: CloudflareEnv) {
  const workspaceId = await getBoardWorkspaceId(boardId, env)
  if (!workspaceId) throw new ForbiddenError("Board not found")
  return requireWorkspaceMember(workspaceId, userId, env)
}

export async function requireBoardEditor(boardId: string, userId: string, env?: CloudflareEnv) {
  const workspaceId = await getBoardWorkspaceId(boardId, env)
  if (!workspaceId) throw new ForbiddenError("Board not found")
  return requireWorkspaceEditor(workspaceId, userId, env)
}

export async function getListBoardId(listId: string, env?: CloudflareEnv) {
  const db = getDb(env)
  const [row] = await db.select({ boardId: lists.boardId }).from(lists).where(eq(lists.id, listId))
  return row?.boardId ?? null
}

export async function requireListMember(listId: string, userId: string, env?: CloudflareEnv) {
  const boardId = await getListBoardId(listId, env)
  if (!boardId) throw new ForbiddenError("List not found")
  return requireBoardMember(boardId, userId, env)
}

export async function requireListEditor(listId: string, userId: string, env?: CloudflareEnv) {
  const boardId = await getListBoardId(listId, env)
  if (!boardId) throw new ForbiddenError("List not found")
  return requireBoardEditor(boardId, userId, env)
}

export async function getCardBoardId(cardId: string, env?: CloudflareEnv) {
  const db = getDb(env)
  const [row] = await db.select({ boardId: cards.boardId }).from(cards).where(eq(cards.id, cardId))
  return row?.boardId ?? null
}

export async function requireCardMember(cardId: string, userId: string, env?: CloudflareEnv) {
  const boardId = await getCardBoardId(cardId, env)
  if (!boardId) throw new ForbiddenError("Card not found")
  return requireBoardMember(boardId, userId, env)
}

export async function requireCardEditor(cardId: string, userId: string, env?: CloudflareEnv) {
  const boardId = await getCardBoardId(cardId, env)
  if (!boardId) throw new ForbiddenError("Card not found")
  return requireBoardEditor(boardId, userId, env)
}

export async function getChecklistCardId(checklistId: string, env?: CloudflareEnv) {
  const db = getDb(env)
  const [row] = await db.select({ cardId: checklists.cardId }).from(checklists).where(eq(checklists.id, checklistId))
  return row?.cardId ?? null
}

export async function requireChecklistMember(checklistId: string, userId: string, env?: CloudflareEnv) {
  const cardId = await getChecklistCardId(checklistId, env)
  if (!cardId) throw new ForbiddenError("Checklist not found")
  return requireCardMember(cardId, userId, env)
}

export async function getChecklistItemChecklistId(itemId: string, env?: CloudflareEnv) {
  const db = getDb(env)
  const [row] = await db
    .select({ checklistId: checklistItems.checklistId })
    .from(checklistItems)
    .where(eq(checklistItems.id, itemId))
  return row?.checklistId ?? null
}

export async function requireChecklistItemMember(itemId: string, userId: string, env?: CloudflareEnv) {
  const checklistId = await getChecklistItemChecklistId(itemId, env)
  if (!checklistId) throw new ForbiddenError("Checklist item not found")
  return requireChecklistMember(checklistId, userId, env)
}
