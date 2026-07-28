export type CardMemberT = { userId: string; name: string; email: string; image: string | null }
export type CardLabelT = { id: string; name: string; color: string }
export type ChecklistItemT = {
  id: string
  checklistId: string
  text: string
  isComplete: boolean
  sortKey: string
}
export type ChecklistT = { id: string; title: string; sortKey: string; items: ChecklistItemT[] }
export type CommentT = {
  id: string
  body: string
  createdAt: Date
  authorId: string
  authorName: string
  authorEmail: string
}

export type AttachmentT = {
  id: string
  fileName: string
  contentType: string | null
  sizeBytes: number | null
  createdAt: Date
  uploadedBy: string
}

export type CardDetailT = {
  card: {
    id: string
    listId: string
    boardId: string
    title: string
    description: string | null
    dueDate: Date | null
    createdAt: Date
  }
  members: CardMemberT[]
  labels: CardLabelT[]
  checklists: ChecklistT[]
  comments: CommentT[]
  attachments: AttachmentT[]
}

export type BoardMemberT = { userId: string; role: string; name: string; email: string; image: string | null }
